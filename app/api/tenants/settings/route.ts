export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  audit,
  getAuthUser,
  handleError,
  ok,
  unauthorized,
} from '@/lib/api-utils';
import { tenantSettingsSchema } from '@/lib/validations';

export async function GET() {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser?.tenantId) return unauthorized();

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: dbUser.tenantId },
      select: {
        id: true,
        name: true,
        nameAr: true,
        phone: true,
        currency: true,
        taxRate: true,
        logo: true,
      },
    });

    if (!tenant) return unauthorized();
    return ok(tenant);
  } catch (error) {
    return handleError(error, 'GET /api/tenants/settings');
  }
}

export async function PUT(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser?.tenantId) return unauthorized();

  try {
    const body = tenantSettingsSchema.parse(await req.json());
    const tenant = await prisma.tenant.update({
      where: { id: dbUser.tenantId },
      data: {
        name: body.name,
        nameAr: body.nameAr || null,
        phone: body.phone || null,
        logo: body.logo || null,
        currency: body.currency,
        taxRate: body.taxRate,
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        phone: true,
        currency: true,
        taxRate: true,
        logo: true,
      },
    });

    await audit(dbUser.id, 'UPDATE', 'tenant', dbUser.tenantId, {
      currency: tenant.currency,
      taxRate: tenant.taxRate,
      logoChanged: body.logo !== undefined,
    });

    return ok(tenant);
  } catch (error) {
    return handleError(error, 'PUT /api/tenants/settings');
  }
}
