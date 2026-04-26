import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, notFound, handleError } from '@/lib/api-utils';
import { customerSchema } from '@/lib/validations';

type P = { params: { id: string } };

export async function GET(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: { sales: { orderBy: { createdAt: 'desc' }, take: 20, include: { items: true } } },
  });
  if (!customer) return notFound('Customer');
  return ok(customer);
}

export async function PUT(req: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  try {
    const body = customerSchema.partial().parse(await req.json());
    const customer = await prisma.customer.update({ where: { id: params.id }, data: body });
    return ok(customer);
  } catch (e) { return handleError(e); }
}

export async function DELETE(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  try {
    await prisma.customer.delete({ where: { id: params.id } });
    return ok({ message: 'Deleted' });
  } catch (e) { return handleError(e); }
}
