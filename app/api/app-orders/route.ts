export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || undefined;
    const reviewStatus = searchParams.get('reviewStatus') || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (reviewStatus) where.paymentReviewStatus = reviewStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.shopOrder.findMany({
      where,
      include: {
        items: true,
        branch: { select: { id: true, name: true, nameAr: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, name: true, nameAr: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok({ data: orders });
  } catch (error) {
    return handleError(error, 'GET /api/app-orders');
  }
}
