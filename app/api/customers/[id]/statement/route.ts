export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, notFound, handleError } from '@/lib/api-utils';

type P = { params: { id: string } };

export async function GET(req: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  try {
    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        creditInvoices: {
          include: {
            payments: { orderBy: { createdAt: 'asc' } },
            sale: { select: { id: true, invoiceNumber: true, createdAt: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        creditPayments: { orderBy: { createdAt: 'desc' } },
        transactions: { orderBy: { createdAt: 'desc' } },
        sales: {
          orderBy: { createdAt: 'desc' },
          include: { payments: { orderBy: { createdAt: 'asc' } }, creditInvoice: true },
        },
      },
    });

    if (!customer) return notFound('Customer');

    const filteredTransactions = customer.transactions.filter((tx) => {
      const createdAt = new Date(tx.createdAt).getTime();
      if (from && createdAt < new Date(from).getTime()) return false;
      if (to && createdAt > new Date(to).getTime()) return false;
      return true;
    });

    return ok({
      customer,
      transactions: filteredTransactions,
      summary: {
        currentBalance: customer.accountBalance,
        totalDebt: customer.creditInvoices.reduce((sum, invoice) => sum + invoice.remainingAmount, 0),
        totalPayments: customer.creditPayments.reduce((sum, payment) => sum + payment.amount, 0),
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
