export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, handleError } from '@/lib/api-utils';
import { supplierSchema } from '@/lib/validations';

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = supplierSchema.partial().parse(await req.json());
    const supplier = await prisma.supplier.update({ where: { id: params.id }, data: body });
    return ok(supplier);
  } catch (error) {
    return handleError(error);
  }
}
