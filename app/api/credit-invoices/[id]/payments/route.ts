export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, notFound, handleError, audit, generateCreditPaymentNumber } from '@/lib/api-utils';
import { creditPaymentSchema } from '@/lib/validations';
import { extractPaymentReceiptImage, stripPaymentReceiptImage } from '@/lib/payment-receipt';

type P = { params: { id: string } };

function parseReferenceNumber(notes?: string | null) {
  if (!notes) return undefined;
  const match = notes.match(/رقم المرجع:\s*([^\n|]+)/);
  return match?.[1]?.trim() || undefined;
}

export async function GET(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const payments = await prisma.creditPayment.findMany({
    where: { creditInvoiceId: params.id },
    orderBy: { createdAt: 'asc' },
    include: { customer: true, user: true, creditInvoice: true },
  });
  return ok(payments);
}

export async function POST(req: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = creditPaymentSchema.parse(await req.json());
    const invoice = await prisma.creditInvoice.findUnique({
      where: { id: params.id },
      include: { customer: true, sale: true },
    });
    if (!invoice) return notFound('Credit invoice');

    const amount = Math.min(body.amount, invoice.remainingAmount);
    if (amount <= 0) throw new Error('لا يمكن تسجيل دفعة أكبر من الرصيد المتبقي');

    const paymentNotes = stripPaymentReceiptImage(body.notes);
    const receiptImage = extractPaymentReceiptImage(body.notes);
    const paymentNumber = await generateCreditPaymentNumber();

    const updated = await prisma.$transaction(async (tx) => {
      const previousBalance = invoice.remainingAmount;
      const remainingBalance = Math.max(0, previousBalance - amount);

      const payment = await tx.creditPayment.create({
        data: {
          creditInvoiceId: invoice.id,
          customerId: invoice.customerId,
          branchId: invoice.branchId,
          userId: dbUser.id,
          amount,
          method: body.method as any,
          referenceNumber: parseReferenceNumber(body.notes),
          notes: paymentNotes || undefined,
          previousBalance,
          remainingBalance,
        },
      });

      await tx.creditInvoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: { increment: amount },
          remainingAmount: remainingBalance,
          status: remainingBalance === 0 ? 'PAID' : 'PARTIAL',
        },
      });

      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          accountBalance: { decrement: amount },
        },
      });

      await tx.customerTransaction.create({
        data: {
          customerId: invoice.customerId,
          creditInvoiceId: invoice.id,
          saleId: invoice.saleId,
          type: 'PAYMENT',
          debit: 0,
          credit: amount,
          balanceAfter: remainingBalance,
          notes: paymentNotes || 'سداد دين',
          cashierId: dbUser.id,
        },
      });

      return { payment, paymentNumber, receiptImage };
    });

    await audit(dbUser.id, 'PAYMENT', 'creditInvoice', params.id, {
      amount,
      method: body.method,
      paymentNumber: updated.paymentNumber,
    });

    return ok({
      ...updated.payment,
      receiptImage: receiptImage || undefined,
      paymentNumber: updated.paymentNumber,
    });
  } catch (e) {
    return handleError(e);
  }
}
