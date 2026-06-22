export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, notFound, handleError, audit, generateCreditPaymentNumber } from '@/lib/api-utils';
import { z } from 'zod';
import { extractPaymentReceiptImage, stripPaymentReceiptImage } from '@/lib/payment-receipt';

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'CARD', 'MOBILE', 'QR']).default('CASH'),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
});

type P = { params: { id: string } };

function parseReferenceNumber(notes?: string | null, explicit?: string) {
  if (explicit?.trim()) return explicit.trim();
  if (!notes) return undefined;
  const match = notes.match(/رقم المرجع:\s*([^\n|]+)/);
  return match?.[1]?.trim() || undefined;
}

export async function POST(req: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = paymentSchema.parse(await req.json());

    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: { creditInvoice: true },
    });
    if (!sale) return notFound('Sale');
    if (sale.status === 'COMPLETED' || sale.status === 'REFUNDED' || sale.status === 'VOID') {
      return handleError(new Error('لا يمكن إضافة دفعة لفاتورة مغلقة أو مستردة أو ملغاة'));
    }

    const remaining = Math.max(0, sale.total - sale.paidAmount);
    const applied = Math.min(body.amount, remaining);
    const newPaid = sale.paidAmount + applied;
    const newStatus = newPaid >= sale.total ? 'COMPLETED' : 'PARTIAL';

    const updated = await prisma.$transaction(async (tx) => {
      const paymentNotes = stripPaymentReceiptImage(body.notes);
      const receiptImage = extractPaymentReceiptImage(body.notes);

      await tx.payment.create({
        data: {
          saleId: sale.id,
          amount: applied,
          method: body.method as any,
          notes: paymentNotes || undefined,
          referenceNumber: parseReferenceNumber(body.notes, body.referenceNumber),
          receiptImage: receiptImage || undefined,
        },
      });

      if (sale.creditInvoice) {
        const previousBalance = sale.creditInvoice.remainingAmount;
        const remainingBalance = Math.max(0, previousBalance - applied);

        await tx.creditPayment.create({
          data: {
            creditInvoiceId: sale.creditInvoice.id,
            customerId: sale.customerId!,
            branchId: sale.branchId,
            userId: dbUser.id,
            amount: applied,
            method: body.method as any,
            referenceNumber: parseReferenceNumber(body.notes, body.referenceNumber),
            notes: paymentNotes || undefined,
            previousBalance,
            remainingBalance,
          },
        });

        await tx.creditInvoice.update({
          where: { id: sale.creditInvoice.id },
          data: {
            paidAmount: { increment: applied },
            remainingAmount: remainingBalance,
            status: remainingBalance === 0 ? 'PAID' : remainingBalance < sale.creditInvoice.remainingAmount ? 'PARTIAL' : 'UNPAID',
          },
        });

        await tx.customer.update({
          where: { id: sale.customerId! },
          data: {
            accountBalance: { decrement: applied },
          },
        });

        const balanceAfter = Math.max(0, (sale.creditInvoice.remainingAmount || 0) - applied);
        await tx.customerTransaction.create({
          data: {
            customerId: sale.customerId!,
            creditInvoiceId: sale.creditInvoice.id,
            saleId: sale.id,
            type: 'PAYMENT',
            debit: 0,
            credit: applied,
            balanceAfter,
            notes: paymentNotes || 'سداد جزئي/كامل',
            cashierId: dbUser.id,
          },
        });
      }

      return tx.sale.update({
        where: { id: params.id },
        data: { paidAmount: newPaid, status: newStatus as any },
        include: {
          items: true,
          customer: { select: { id: true, name: true, phone: true, accountBalance: true } },
          branch: { select: { id: true, name: true, nameAr: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          payments: { orderBy: { createdAt: 'asc' } },
          creditInvoice: { include: { payments: { orderBy: { createdAt: 'asc' } } } },
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
