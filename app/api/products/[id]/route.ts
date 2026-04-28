export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, notFound, handleError, audit } from '@/lib/api-utils';
import { productUpdateSchema } from '@/lib/validations';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      inventory: { include: { branch: { select: { id: true, name: true, nameAr: true } } } },
    },
  });

  if (!product) return notFound('Product');
  return ok(product);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = productUpdateSchema.parse(await req.json());
    const { initialStock, branchId, minStock, ...data } = body as any;

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: {
          ...data,
          ...(minStock !== undefined ? { minStock } : {}),
        },
        include: { category: true },
      });

      const targetBranchId = branchId || dbUser.branchId;
      if (targetBranchId && (initialStock !== undefined || minStock !== undefined)) {
        await tx.inventory.upsert({
          where: { productId_branchId: { productId: params.id, branchId: targetBranchId } },
          create: {
            productId: params.id,
            branchId: targetBranchId,
            quantity: initialStock ?? 0,
            minStock: minStock ?? updatedProduct.minStock,
          },
          update: {
            ...(initialStock !== undefined ? { quantity: initialStock } : {}),
            ...(minStock !== undefined ? { minStock } : {}),
          },
        });
      }

      return updatedProduct;
    });

    await audit(dbUser.id, 'UPDATE', 'product', product.id, data);
    return ok(product);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return PUT(req, { params });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { dbUser } = await getAuthUser('OWNER');
  if (!dbUser) return unauthorized();
  if (dbUser.role !== 'OWNER') return forbidden();

  try {
    await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
    await audit(dbUser.id, 'DELETE', 'product', params.id);
    return ok({ message: 'تم حذف المنتج' });
  } catch (e) {
    return handleError(e);
  }
}
