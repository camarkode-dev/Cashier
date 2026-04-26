import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError, unauthorized } from '@/lib/api-utils';
import { loginSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) return unauthorized('بيانات الدخول غير صحيحة');

    const dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { branch: true },
    });

    if (!dbUser || !dbUser.isActive) {
      await supabase.auth.signOut();
      return unauthorized('الحساب غير نشط');
    }

    // Update last login
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { updatedAt: new Date() },
    });

    return ok({ user: dbUser, session: data.session });
  } catch (e) {
    return handleError(e);
  }
}
