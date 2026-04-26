import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, created, unauthorized, forbidden, handleError } from '@/lib/api-utils';
import { categorySchema } from '@/lib/validations';

export async function GET() {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  const data = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
  return ok(data);
}

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();
  try {
    const body = categorySchema.parse(await req.json());
    const cat = await prisma.category.create({ data: body });
    return created(cat);
  } catch (e) { return handleError(e); }
}
