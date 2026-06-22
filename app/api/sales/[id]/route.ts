export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, err, unauthorized, forbidden, notFound, handleError, audit } from '@/lib/api-utils';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const sale = await prisma.sale.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: { select: { id: true, name: true, nameAr: true, image: true } } } },
      user: { select: { id: true, firstName: true, lastName: true } },
      customer: { select: { id: true, name: true, nameAr: true, phone: true, accountBalance: true } },
      branch: { select: { id: true, name: true, nameAr: true } },
      payments: { orderBy: { createdAt: 'asc' } },
      creditInvoice: {
        include: {
          payments: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  });

  if (!sale) return notFound('Sale');

  // Cashier can only view own sales
  if (dbUser.role === 'CASHIER' && sale.userId !== dbUser.id) return forbidden();

  return ok(sale);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { dbUser } = await getAuthUser('ADMIN');
    if (!dbUser) return unauthorized();

    const body = await req.json();
    const { action, reason, customerPhone } = body;

    if (action !== 'refund' && action !== 'void') {
      return err('إجراء غير صالح', 400);
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        customer: true,
        user: true,
        branch: true,
        payments: true,
        creditInvoice: true,
      },
    });

    if (!sale) return notFound('Sale');
    if (sale.status !== 'COMPLETED') {
      return err('لا يمكن إجراء هذا الإجراء — الفاتورة ليست مكتملة', 409);
    }

    const newStatus = action === 'refund' ? 'REFUNDED' : 'VOID';

    const refundNote = action === 'refund'
      ? [reason ? `سبب الاسترجاع: ${reason}` : null, customerPhone ? `هاتف العميل: ${customerPhone}` : null].filter(Boolean).join(' | ')
      : null;
    const updatedNotes = [refundNote, sale.notes].filter(Boolean).join('\n') || (sale.notes ?? undefined);

    const updated = await prisma.$transaction(async (tx) => {
      if (action === 'refund') {
        for (const item of sale.items) {
          await tx.inventory.updateMany({
            where: { productId: item.productId, branchId: sale.branchId },
            data: { quantity: { increment: item.quantity } },
          });
        }

        if (sale.customerId) {
          const currentCustomer = await tx.customer.findUnique({ where: { id: sale.customerId }, select: { loyaltyPoints: true, totalSpent: true } });
          if (currentCustomer) {
            await tx.customer.update({
              where: { id: sale.customerId },
              data: {
                loyaltyPoints: { decrement: Math.min(currentCustomer.loyaltyPoints, Math.floor(sale.total / 10)) },
                totalSpent: { decrement: Math.min(currentCustomer.totalSpent, sale.total) },
              },
            });
          }
        }
      }

      return tx.sale.update({
        where: { id: params.id },
        data: { status: newStatus, ...(updatedNotes !== undefined && { notes: updatedNotes }) },
        include: { items: true, customer: true, user: true, branch: true },
      });
    });

    await audit(dbUser.id, action.toUpperCase(), 'sale', params.id);
    return ok(updated);
  } catch (e: any) {
    console.error('[PATCH /api/sales/:id] error:', e?.message ?? e);
    return handleError(e);
  }
}
