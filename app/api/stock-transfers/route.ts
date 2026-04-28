export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, created, unauthorized, forbidden, handleError, audit } from '@/lib/api-utils';
import { stockTransferSchema } from '@/lib/validations';
import { err } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get('branchId') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  const where: any = {};
  if (branchId) where.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];

  const [data, total] = await Promise.all([
    prisma.stockTransfer.findMany({
      where,
      include: {
        fromBranch: { select: { id: true, name: true, nameAr: true } },
        toBranch: { select: { id: true, name: true, nameAr: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: { include: { product: { select: { id: true, name: true, nameAr: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockTransfer.count({ where }),
  ]);

  return ok({ data, meta: { total, page, limit } });
}

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = stockTransferSchema.parse(await req.json());

    if (body.fromBranchId === body.toBranchId) {
      return err('الفرع المصدر والوجهة متطابقان', 400);
    }

    const [product, fromInv, toInv] = await Promise.all([
      prisma.product.findFirst({ where: { id: body.productId, isActive: true } }),
      prisma.inventory.findFirst({ where: { productId: body.productId, branchId: body.fromBranchId } }),
      prisma.inventory.findFirst({ where: { productId: body.productId, branchId: body.toBranchId } }),
    ]);

    if (!product) return err('المنتج غير موجود', 404);
    if (!fromInv || fromInv.quantity < body.quantity) {
      return err(`مخزون غير كافٍ. المتاح: ${fromInv?.quantity ?? 0}`, 400);
    }

    const transfer = await prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { id: fromInv.id },
        data: { quantity: { decrement: body.quantity } },
      });

      if (toInv) {
        await tx.inventory.update({ where: { id: toInv.id }, data: { quantity: { increment: body.quantity } } });
      } else {
        await tx.inventory.create({
          data: { productId: body.productId, branchId: body.toBranchId, quantity: body.quantity },
        });
      }

      const t = await tx.stockTransfer.create({
        data: {
          fromBranchId: body.fromBranchId,
          toBranchId: body.toBranchId,
          notes: body.notes,
          createdById: dbUser.id,
          status: 'COMPLETED',
          items: { create: [{ productId: body.productId, quantity: body.quantity, costPrice: product.costPrice }] },
        },
        include: {
          fromBranch: { select: { name: true, nameAr: true } },
          toBranch: { select: { name: true, nameAr: true } },
          items: { include: { product: { select: { name: true, nameAr: true } } } },
        },
      });

      // Notify
      await tx.notification.create({
        data: {
          type: 'STOCK_TRANSFER',
          title: 'Stock Transfer Completed',
          titleAr: 'تم نقل المخزون',
          message: `Transferred ${body.quantity} units of ${product.nameAr || product.name}`,
          messageAr: `تم نقل ${body.quantity} وحدة من ${product.nameAr || product.name}`,
          data: { transferId: t.id, quantity: body.quantity },
        },
      });

      return t;
    });

    await audit(dbUser.id, 'CREATE', 'stock_transfer', transfer.id, { quantity: body.quantity, productId: body.productId });
    return created(transfer);
  } catch (e) {
    return handleError(e);
  }
}
