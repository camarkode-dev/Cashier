export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: { barcode: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const branchId = req.nextUrl.searchParams.get('branchId') || dbUser.branchId || undefined;

  const product = await prisma.product.findFirst({
    where: { barcode: params.barcode, isActive: true },
    include: {
      category: true,
      inventory: branchId ? { where: { branchId }, take: 1 } : { take: 1 },
    },
  });

  if (!product) return notFound('Product');
  return ok(product);
}
