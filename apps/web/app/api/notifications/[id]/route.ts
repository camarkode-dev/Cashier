import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, handleError } from '@/lib/api-utils';

type P = { params: { id: string } };

export async function PATCH(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  try {
    const n = await prisma.notification.update({ where: { id: params.id }, data: { isRead: true } });
    return ok(n);
  } catch (e) { return handleError(e); }
}

export async function DELETE(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  try {
    await prisma.notification.delete({ where: { id: params.id } });
    return ok({ message: 'Deleted' });
  } catch (e) { return handleError(e); }
}
