import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, created, unauthorized, forbidden, handleError } from '@/lib/api-utils';
import { supplierSchema } from '@/lib/validations';

export async function GET() {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  const data = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  return ok(data);
}

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();
  try {
    const body = supplierSchema.parse(await req.json());
    const supplier = await prisma.supplier.create({ data: body });
    return created(supplier);
  } catch (e) { return handleError(e); }
}
