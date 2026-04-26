import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(new Date().setDate(1));
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date();
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
  const sortBy = searchParams.get('sortBy') || 'revenue'; // revenue | profit | quantity

  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        status: 'COMPLETED',
        createdAt: { gte: from, lte: to },
      },
    },
    include: {
      product: { select: { id: true, name: true, nameAr: true, category: { select: { name: true, nameAr: true, color: true } } } },
    },
  });

  // Aggregate by product
  const productMap = new Map<string, {
    productId: string; name: string; nameAr?: string | null;
    category?: any; revenue: number; profit: number; quantity: number; count: number;
  }>();

  for (const item of saleItems) {
    const key = item.productId;
    const existing = productMap.get(key) || {
      productId: key,
      name: item.name,
      nameAr: item.nameAr,
      category: item.product?.category,
      revenue: 0,
      profit: 0,
      quantity: 0,
      count: 0,
    };
    existing.revenue += item.total;
    existing.profit += item.profit;
    existing.quantity += item.quantity;
    existing.count += 1;
    productMap.set(key, existing);
  }

  let results = Array.from(productMap.values());

  if (sortBy === 'profit') results.sort((a, b) => b.profit - a.profit);
  else if (sortBy === 'quantity') results.sort((a, b) => b.quantity - a.quantity);
  else results.sort((a, b) => b.revenue - a.revenue);

  return ok(results.slice(0, limit));
}
