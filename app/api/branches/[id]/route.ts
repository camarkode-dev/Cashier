export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, handleError } from '@/lib/api-utils';
import { branchSchema } from '@/lib/validations';

type P = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('OWNER');
  if (!dbUser) return unauthorized();
  if (dbUser.role !== 'OWNER') return forbidden();
  try {
    const body = branchSchema.partial().parse(await req.json());
    const branch = await prisma.branch.update({ where: { id: params.id }, data: body });
    return ok(branch);
  } catch (e) { return handleError(e); }
}

export async function DELETE(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('OWNER');
  if (!dbUser) return unauthorized();
  if (dbUser.role !== 'OWNER') return forbidden();
  try {
    const branch = await prisma.branch.findUnique({ where: { id: params.id } });
    if (branch?.isMain) return handleError(new Error('Cannot delete main branch'));
    await prisma.branch.update({ where: { id: params.id }, data: { isActive: false } });
    return ok({ message: 'Deleted' });
  } catch (e) { return handleError(e); }
}
