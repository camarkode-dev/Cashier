export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUser, ok, created, unauthorized, forbidden, handleError, audit } from '@/lib/api-utils';
import { createUserSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  const { searchParams } = req.nextUrl;
  const role = searchParams.get('role') || undefined;
  const branchId = searchParams.get('branchId') || undefined;

  const data = await prisma.user.findMany({
    where: { ...(role ? { role: role as any } : {}), ...(branchId ? { branchId } : {}) },
    include: { branch: { select: { id: true, name: true, nameAr: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return ok(data);
}

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = createUserSchema.parse(await req.json());

    // Create Supabase auth user
    const adminClient = createAdminClient();
    if (!adminClient) return handleError(new Error('Admin client not configured'));

    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (authErr || !authData?.user) {
      return handleError(authErr || new Error('Failed to create auth user'));
    }

    // Create database user record
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role as any,
        branchId: body.branchId,
        phone: body.phone,
      },
      include: { branch: true },
    });

    await audit(dbUser.id, 'CREATE', 'user', user.id, { role: user.role, email: user.email });
    return created(user);
  } catch (e) {
    return handleError(e);
  }
}
