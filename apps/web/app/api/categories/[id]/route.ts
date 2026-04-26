import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, notFound, handleError } from '@/lib/api-utils';
import { categorySchema } from '@/lib/validations';

type P = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();
  try {
    const body = categorySchema.partial().parse(await req.json());
    const cat = await prisma.category.update({ where: { id: params.id }, data: body });
    return ok(cat);
  } catch (e) { return handleError(e); }
}

export async function DELETE(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('OWNER');
  if (!dbUser) return unauthorized();
  if (dbUser.role !== 'OWNER') return forbidden();
  try {
    await prisma.category.delete({ where: { id: params.id } });
    return ok({ message: 'Deleted' });
  } catch (e) { return handleError(e); }
}
