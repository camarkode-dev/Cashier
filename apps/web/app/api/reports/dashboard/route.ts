import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const branchId = req.nextUrl.searchParams.get('branchId') || dbUser.branchId || undefined;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const baseWhere = (from: Date) => ({
    status: 'COMPLETED' as const,
    createdAt: { gte: from },
    ...(branchId ? { branchId } : {}),
  });

  const [todaySales, monthSales, yearSales, totalProducts, totalCustomers, lowStockCount] =
    await Promise.all([
      prisma.sale.aggregate({ _sum: { total: true, profit: true }, _count: true, where: baseWhere(todayStart) }),
      prisma.sale.aggregate({ _sum: { total: true, profit: true }, _count: true, where: baseWhere(monthStart) }),
      prisma.sale.aggregate({ _sum: { total: true, profit: true }, _count: true, where: baseWhere(yearStart) }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.inventory.count({
        where: {
          ...(branchId ? { branchId } : {}),
          quantity: { lte: 5 },
          product: { isActive: true },
        },
      }),
    ]);

  // Daily chart for last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentSales = await prisma.sale.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: thirtyDaysAgo },
      ...(branchId ? { branchId } : {}),
    },
    select: { createdAt: true, total: true, profit: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const dailyMap = new Map<string, { date: string; revenue: number; profit: number; count: number }>();
  for (const sale of recentSales) {
    const key = sale.createdAt.toISOString().split('T')[0];
    const existing = dailyMap.get(key) || { date: key, revenue: 0, profit: 0, count: 0 };
    existing.revenue += sale.total;
    existing.profit += sale.profit;
    existing.count += 1;
    dailyMap.set(key, existing);
  }
  const dailyChart = Array.from(dailyMap.values());

  // Recent sales
  const recentSalesList = await prisma.sale.findMany({
    where: { ...(branchId ? { branchId } : {}) },
    include: {
      user: { select: { firstName: true, lastName: true } },
      customer: { select: { name: true, nameAr: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return ok({
    today: {
      revenue: todaySales._sum.total || 0,
      profit: todaySales._sum.profit || 0,
      count: todaySales._count,
    },
    month: {
      revenue: monthSales._sum.total || 0,
      profit: monthSales._sum.profit || 0,
      count: monthSales._count,
    },
    year: {
      revenue: yearSales._sum.total || 0,
      profit: yearSales._sum.profit || 0,
      count: yearSales._count,
    },
    totalProducts,
    totalCustomers,
    lowStockCount,
    dailyChart,
    recentSales: recentSalesList,
  });
}
