export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get('branchId') || dbUser.branchId || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || '';
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { nameAr: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search } } },
    ];
  }
  if (dbUser.role === 'CASHIER') where.userId = dbUser.id;

  const data = await prisma.creditInvoice.findMany({
    where,
    include: {
      sale: { select: { id: true, invoiceNumber: true, createdAt: true } },
      customer: { select: { id: true, name: true, nameAr: true, phone: true, accountBalance: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
      payments: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return ok({ data });
}
