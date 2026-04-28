export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [tenantCount, userCount] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
    ]);

    const hasTenant = tenantCount > 0;
    const hasUser = userCount > 0;

    // Check if the current Supabase session user has a DB record
    let currentUserProvisioned = false;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
        currentUserProvisioned = !!dbUser;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        needsSetup: !hasTenant,
        hasTenant,
        hasUser,
        currentUserProvisioned,
      },
    });
  } catch {
    // DB unreachable — don't block setup page
    return NextResponse.json({
      success: true,
      data: { needsSetup: true, hasTenant: false, hasUser: false, currentUserProvisioned: false },
    });
  }
}
