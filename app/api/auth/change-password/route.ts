export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, handleError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const { dbUser } = await getAuthUser();
    if (!dbUser) return unauthorized('غير مصرح');

    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) {
      return handleError(new Error('جميع الحقول مطلوبة'));
    }
    if (newPassword.length < 8) {
      return handleError(new Error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'));
    }

    // تحقق من كلمة المرور القديمة
    const supabase = await createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: dbUser.email,
      password: oldPassword,
    });
    if (loginError) {
      return handleError(new Error('كلمة المرور الحالية غير صحيحة'));
    }

    // غيّر كلمة المرور
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      return handleError(new Error('فشل تغيير كلمة المرور'));
    }

    return ok({ success: true });
  } catch (error) {
    return handleError(error, 'POST /api/auth/change-password');
  }
}
