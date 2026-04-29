export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUser, ok, unauthorized, forbidden, notFound, handleError, audit } from '@/lib/api-utils';
import { updateUserSchema } from '@/lib/validations';

type P = { params: { id: string } };

export async function GET(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { branch: true, _count: { select: { sales: true } } },
  });
  if (!user) return notFound('User');
  return ok(user);
}

export async function PATCH(req: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = updateUserSchema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id: params.id },
      data: body,
      include: { branch: true },
    });
    await audit(dbUser.id, 'UPDATE', 'user', params.id, body);
    return ok(user);
  } catch (e) { return handleError(e); }
}

export async function DELETE(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();
  if (params.id === dbUser.id) return forbidden('لا يمكنك حذف حسابك الخاص');

  try {
    // Remove from Supabase auth so user can no longer login
    const adminClient = createAdminClient();
    if (adminClient) {
      await adminClient.auth.admin.deleteUser(params.id).catch(() => {});
    }

    // Soft-delete in DB to preserve sales history
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    await audit(dbUser.id, 'DELETE', 'user', params.id);
    return ok(user);
  } catch (e) { return handleError(e); }
}
