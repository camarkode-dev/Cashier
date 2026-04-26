import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, created, unauthorized, forbidden, handleError } from '@/lib/api-utils';
import { expenseSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get('branchId') || dbUser.branchId || undefined;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = 50;

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [data, total, summary] = await Promise.all([
    prisma.expense.findMany({ where, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.expense.count({ where }),
    prisma.expense.groupBy({ by: ['category'], where, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
  ]);

  return ok({ data, meta: { total, page, limit }, summary });
}

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();
  try {
    const body = expenseSchema.parse(await req.json());
    const expense = await prisma.expense.create({
      data: { ...body, date: body.date ? new Date(body.date) : new Date() },
    });
    return created(expense);
  } catch (e) { return handleError(e); }
}
