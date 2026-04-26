import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, handleError } from '@/lib/api-utils';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get('branchId') || dbUser.branchId || undefined;
  const lowStock = searchParams.get('lowStock') === 'true';

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (lowStock) where.quantity = { lte: prisma.inventory.fields.minStock };

  const data = await prisma.inventory.findMany({
    where,
    include: {
      product: {
        include: { category: { select: { id: true, name: true, nameAr: true, color: true } } },
      },
      branch: { select: { id: true, name: true, nameAr: true } },
    },
    orderBy: { product: { name: 'asc' } },
  });

  return ok(data);
}

export async function PATCH(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();

  try {
    const body = z.object({
      productId: z.string(),
      branchId: z.string(),
      quantity: z.number().int().nonnegative(),
      minStock: z.number().int().nonnegative().optional(),
    }).parse(await req.json());

    const inv = await prisma.inventory.upsert({
      where: { productId_branchId: { productId: body.productId, branchId: body.branchId } },
      create: body,
      update: { quantity: body.quantity, ...(body.minStock !== undefined ? { minStock: body.minStock } : {}) },
    });

    return ok(inv);
  } catch (e) { return handleError(e); }
}
