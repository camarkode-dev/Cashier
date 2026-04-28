export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, created, unauthorized, forbidden, handleError } from '@/lib/api-utils';
import { branchSchema } from '@/lib/validations';

export async function GET() {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  const data = await prisma.branch.findMany({
    where: { isActive: true },
    include: { _count: { select: { users: true, sales: true } } },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  });
  return ok(data);
}

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser('OWNER');
  if (!dbUser) return unauthorized();
  if (dbUser.role !== 'OWNER') return forbidden();
  try {
    const body = branchSchema.parse(await req.json());
    const branch = await prisma.$transaction(async (tx) => {
      const b = await tx.branch.create({ data: body });
      // Create inventory records for all products in the new branch
      const products = await tx.product.findMany({ where: { isActive: true }, select: { id: true, minStock: true } });
      if (products.length > 0) {
        await tx.inventory.createMany({
          data: products.map((p) => ({ productId: p.id, branchId: b.id, quantity: 0, minStock: p.minStock })),
          skipDuplicates: true,
        });
      }
      return b;
    });
    return created(branch);
  } catch (e) { return handleError(e); }
}
