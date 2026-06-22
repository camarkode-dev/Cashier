export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, notFound, handleError } from '@/lib/api-utils';

type P = { params: { id: string } };

function getStock(product: { inventory?: Array<{ quantity: number }> }) {
  return product.inventory?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export async function GET(_: NextRequest, { params }: P) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: params.id, isActive: true },
      include: {
        category: true,
        inventory: { include: { branch: { select: { id: true, name: true, nameAr: true } } } },
      },
    });

    if (!product) return notFound('Product');

    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId || undefined,
        id: { not: product.id },
      },
      include: {
        category: true,
        inventory: true,
      },
      take: 8,
    });

    return ok({
      product: {
        ...product,
        stock: getStock(product),
        galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages : [],
      },
      related: related.map((item) => ({
        ...item,
        stock: getStock(item),
        galleryImages: Array.isArray(item.galleryImages) ? item.galleryImages : [],
      })),
    });
  } catch (error) {
    return handleError(error, 'GET /api/shop/products/:id');
  }
}
