export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, handleError } from '@/lib/api-utils';

function getStock(product: { inventory?: Array<{ quantity: number }> }) {
  return product.inventory?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || undefined;
    const sort = searchParams.get('sort') || 'latest';
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [categories, products, topProductsRaw] = await Promise.all([
      prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          inventory: { include: { branch: { select: { id: true, name: true, nameAr: true } } } },
        },
        take: limit,
      }),
      prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 50,
      }),
    ]);

    const productIds = topProductsRaw.map((item) => item.productId);
    const topProductDetails = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, nameAr: true },
        })
      : [];
    const topLookup = new Map(topProductDetails.map((product) => [product.id, product]));
    const topProducts = topProductsRaw.map((item) => ({
      productId: item.productId,
      quantity: item._sum.quantity || 0,
      name: topLookup.get(item.productId)?.name || '',
      nameAr: topLookup.get(item.productId)?.nameAr || null,
    }));

    const shapedProducts = products.map((product) => ({
      ...product,
      stock: getStock(product),
      galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages : [],
    }));

    if (sort === 'price') {
      shapedProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'name') {
      shapedProducts.sort((a, b) => (a.nameAr || a.name).localeCompare(b.nameAr || b.name, 'ar'));
    } else if (sort === 'top') {
      const rank = new Map(topProducts.map((item, index) => [item.productId, index]));
      shapedProducts.sort((a, b) => (rank.get(a.id) ?? 9999) - (rank.get(b.id) ?? 9999));
    } else {
      shapedProducts.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }

    return ok({ categories, products: shapedProducts, topProducts });
  } catch (error) {
    return handleError(error, 'GET /api/shop/catalog');
  }
}
