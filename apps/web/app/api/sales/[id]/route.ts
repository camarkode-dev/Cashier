export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, notFound, handleError, audit } from '@/lib/api-utils';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const sale = await prisma.sale.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: { select: { id: true, name: true, nameAr: true, image: true } } } },
      user: { select: { id: true, firstName: true, lastName: true } },
      customer: true,
      branch: { select: { id: true, name: true, nameAr: true } },
    },
  });

  if (!sale) return notFound('Sale');

  // Cashier can only view own sales
  if (dbUser.role === 'CASHIER' && sale.userId !== dbUser.id) return forbidden();

  return ok(sale);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();

  const { action } = await req.json();

  if (action !== 'refund' && action !== 'void') {
    return handleError(new Error('Invalid action'));
  }

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!sale) return notFound('Sale');
    if (sale.status !== 'COMPLETED') {
      return handleError(new Error('Sale is not in COMPLETED status'));
    }

    const newStatus = action === 'refund' ? 'REFUNDED' : 'VOID';

    const updated = await prisma.$transaction(async (tx) => {
      // Restore inventory on refund
      if (action === 'refund') {
        for (const item of sale.items) {
          await tx.inventory.updateMany({
            where: { productId: item.productId, branchId: sale.branchId },
            data: { quantity: { increment: item.quantity } },
          });
        }

        // Reverse loyalty points
        if (sale.customerId) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: {
              loyaltyPoints: { decrement: Math.floor(sale.total / 10) },
              totalSpent: { decrement: sale.total },
            },
          });
        }
      }

      return tx.sale.update({
        where: { id: params.id },
        data: { status: newStatus },
        include: { items: true },
      });
    });

    await audit(dbUser.id, action.toUpperCase(), 'sale', params.id);
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}
