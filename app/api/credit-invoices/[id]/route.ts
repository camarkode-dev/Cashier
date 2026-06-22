export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, notFound, handleError } from '@/lib/api-utils';

type P = { params: { id: string } };

export async function GET(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  try {
    const invoice = await prisma.creditInvoice.findUnique({
      where: { id: params.id },
      include: {
        sale: {
          include: {
            items: true,
            payments: { orderBy: { createdAt: 'asc' } },
          },
        },
        customer: { select: { id: true, name: true, nameAr: true, phone: true, accountBalance: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        branch: { select: { id: true, name: true, nameAr: true } },
        payments: { orderBy: { createdAt: 'asc' } },
        transactions: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!invoice) return notFound('Credit invoice');
    return ok(invoice);
  } catch (e) {
    return handleError(e);
  }
}
