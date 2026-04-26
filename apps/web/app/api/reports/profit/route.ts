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
  const branchId = searchParams.get('branchId') || dbUser.branchId || undefined;
  const groupBy = searchParams.get('groupBy') || 'day'; // day | week | month

  const where: any = {
    status: 'COMPLETED',
    createdAt: { gte: from, lte: to },
  };
  if (branchId) where.branchId = branchId;

  const [sales, totals] = await Promise.all([
    prisma.sale.findMany({
      where,
      select: { createdAt: true, total: true, profit: true, subtotal: true, discountAmount: true, taxAmount: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.sale.aggregate({
      where,
      _sum: { total: true, profit: true, subtotal: true, discountAmount: true, taxAmount: true },
      _count: true,
    }),
  ]);

  // Group by period
  const grouped = new Map<string, { period: string; revenue: number; profit: number; count: number; margin: number }>();

  for (const sale of sales) {
    let key: string;
    const d = sale.createdAt;
    if (groupBy === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    else if (groupBy === 'week') {
      const week = Math.ceil(d.getDate() / 7);
      key = `${d.getFullYear()}-W${week}`;
    } else {
      key = d.toISOString().split('T')[0];
    }

    const existing = grouped.get(key) || { period: key, revenue: 0, profit: 0, count: 0, margin: 0 };
    existing.revenue += sale.total;
    existing.profit += sale.profit;
    existing.count += 1;
    existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
    grouped.set(key, existing);
  }

  const profitMargin =
    totals._sum.total && totals._sum.total > 0
      ? ((totals._sum.profit || 0) / totals._sum.total) * 100
      : 0;

  return ok({
    summary: {
      revenue: totals._sum.total || 0,
      profit: totals._sum.profit || 0,
      subtotal: totals._sum.subtotal || 0,
      discount: totals._sum.discountAmount || 0,
      tax: totals._sum.taxAmount || 0,
      salesCount: totals._count,
      profitMargin: Math.round(profitMargin * 100) / 100,
    },
    chart: Array.from(grouped.values()),
    from: from.toISOString(),
    to: to.toISOString(),
  });
}
