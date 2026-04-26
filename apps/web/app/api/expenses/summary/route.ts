import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized } from '@/lib/api-utils';

export async function GET() {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const branchId = dbUser.branchId || undefined;
  const where: any = {};
  if (branchId) where.branchId = branchId;

  const summary = await prisma.expense.groupBy({
    by: ['category'],
    where,
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  const totalAmount = summary.reduce((sum, item) => sum + (item._sum.amount || 0), 0);

  return ok({ totalAmount, byCategory: summary });
}
