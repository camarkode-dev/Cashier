export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const period = req.nextUrl.searchParams.get('period') || 'daily';
  const branchId = req.nextUrl.searchParams.get('branchId') || dbUser.branchId || undefined;

  const now = new Date();
  let startDate: Date;
  let groupBy: 'day' | 'week' | 'month';

  switch (period) {
    case 'weekly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
      groupBy = 'day';
      break;
    case 'monthly':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
      groupBy = 'month';
      break;
    default: // daily
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
      groupBy = 'day';
  }

  const where = {
    status: 'COMPLETED' as const,
    createdAt: { gte: startDate },
    ...(branchId ? { branchId } : {}),
  };

  const sales = await prisma.sale.findMany({
    where,
    select: { total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group sales by period
  const chartData = sales.reduce((acc: Record<string, { date: string; sales: number; revenue: number }>, sale: { createdAt: string | Date; total: number }) => {
    let key: string;
    const date = new Date(sale.createdAt);

    if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = date.toISOString().split('T')[0];
    }

    if (!acc[key]) {
      acc[key] = { date: key, sales: 0, revenue: 0 };
    }
    acc[key].sales += 1;
    acc[key].revenue += Number(sale.total);
    return acc;
  }, {});

  return ok(Object.values(chartData));
}