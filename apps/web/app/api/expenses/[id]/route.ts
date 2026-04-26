import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, notFound } from '@/lib/api-utils';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  const expense = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!expense || expense.branchId !== dbUser.branchId) return notFound('Expense');

  await prisma.expense.delete({ where: { id: params.id } });
  return ok({ message: 'Deleted' });
}
