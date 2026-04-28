export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import * as bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const count = await prisma.tenant.count();
    if (count > 0) {
      return NextResponse.json(
        { success: false, error: 'النظام مُعدّ مسبقاً. تواصل مع مدير النظام للحصول على حساب.' },
        { status: 403 },
      );
    }

    const { storeName, firstName, lastName, email, password, phone } = await req.json();

    if (!storeName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'يرجى تعبئة جميع الحقول المطلوبة' },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 },
      );
    }

    let userId: string;
    let emailConfirmationRequired = false;

    const adminClient = createAdminClient();
    if (adminClient) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        // User already exists in Supabase auth — find their ID and reuse it
        const alreadyExists =
          error.message.toLowerCase().includes('already') ||
          error.message.toLowerCase().includes('registered') ||
          error.status === 422;
        if (alreadyExists) {
          const { data: list } = await adminClient.auth.admin.listUsers();
          const existing = list?.users?.find((u) => u.email === email);
          if (existing) {
            // Update password in case it changed
            await adminClient.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
            userId = existing.id;
          } else {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
          }
        } else {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
      } else {
        userId = data.user.id;
      }
    } else {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      if (!data.user) {
        return NextResponse.json({ success: false, error: 'فشل إنشاء المستخدم' }, { status: 500 });
      }
      userId = data.user.id;
      emailConfirmationRequired = !data.user.confirmed_at;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const slug = `${storeName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .substring(0, 40) || 'store'}-${Date.now()}`;

    const tenant = await prisma.tenant.create({
      data: {
        id: userId,
        name: storeName,
        nameAr: storeName,
        slug,
        email,
        phone: phone || null,
        users: {
          create: {
            id: userId,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || null,
            role: 'OWNER',
          },
        },
        branches: {
          create: { name: storeName, nameAr: storeName, isMain: true },
        },
        invoiceSettings: { create: {} },
      },
      include: { users: true, branches: true },
    });

    const [owner, branch] = [tenant.users[0], tenant.branches[0]];
    await prisma.user.update({ where: { id: owner.id }, data: { branchId: branch.id } });

    await prisma.license.create({
      data: {
        tenantId: tenant.id,
        key: `TRIAL-${Date.now().toString(16).toUpperCase()}`,
        type: 'BASIC',
        status: 'ACTIVE',
        maxDevices: 5,
        maxUsers: 10,
        maxBranches: 3,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        emailConfirmationRequired,
        message: emailConfirmationRequired
          ? 'تم إنشاء الحساب. يرجى تفعيل البريد الإلكتروني قبل تسجيل الدخول.'
          : 'تم إعداد النظام بنجاح. يمكنك تسجيل الدخول الآن.',
      },
    });
  } catch (e: any) {
    const msg = e?.message || '';
    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي' }, { status: 500 });
  }
}
