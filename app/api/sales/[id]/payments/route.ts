export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, notFound, handleError, audit } from '@/lib/api-utils';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'CARD', 'MOBILE', 'QR', 'SPLIT', 'CREDIT']).default('CASH'),
  notes: z.string().optional(),
});

type P = { params: { id: string } };

export async function POST(req: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = paymentSchema.parse(await req.json());

    const sale = await prisma.sale.findUnique({ where: { id: params.id } });
    if (!sale) return notFound('Sale');
    if (sale.status === 'COMPLETED' || sale.status === 'REFUNDED' || sale.status === 'VOID') {
      return handleError(new Error('لا يمكن إضافة دفعة لفاتورة مغلقة أو مستردة أو ملغاة'));
    }

    const remaining = sale.total - sale.paidAmount;
    const applied = Math.min(body.amount, remaining);
    const newPaid = sale.paidAmount + applied;
    const newStatus = newPaid >= sale.total ? 'COMPLETED' : 'PARTIAL';

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          saleId: sale.id,
          amount: applied,
          method: body.method as any,
          notes: body.notes,
        },
      });

      return tx.sale.update({
        where: { id: params.id },
        data: { paidAmount: newPaid, status: newStatus as any },
        include: {
          items: true,
          customer: { select: { id: true, name: true, phone: true } },
          branch: { select: { id: true, name: true, nameAr: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          payments: { orderBy: { createdAt: 'asc' } },
        },
      });
    });

    await audit(dbUser.id, 'PAYMENT', 'sale', sale.id, { applied, newPaid, newStatus });
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function GET(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const payments = await prisma.payment.findMany({
    where: { saleId: params.id },
    orderBy: { createdAt: 'asc' },
  });
  return ok(payments);
}
