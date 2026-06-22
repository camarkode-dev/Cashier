export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden, notFound, handleError, audit } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';

type P = { params: { id: string } };

async function getRequestUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function GET(_: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();

  try {
    const order = await prisma.shopOrder.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        branch: { select: { id: true, name: true, nameAr: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        customer: true,
      },
    });
    if (!order) return notFound('Shop order');
    return ok(order);
  } catch (error) {
    return handleError(error, 'GET /api/app-orders/:id');
  }
}

export async function PATCH(req: NextRequest, { params }: P) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = await req.json();
    const action = body.action as 'approve' | 'reject' | 'reviewed' | 'cancel';
    const notes = typeof body.notes === 'string' ? body.notes : undefined;

    const order = await prisma.shopOrder.findUnique({ where: { id: params.id } });
    if (!order) return notFound('Shop order');

    const statusMap: Record<string, { status: any; reviewStatus: any }> = {
      approve: { status: 'APPROVED', reviewStatus: 'APPROVED' },
      reject: { status: 'REJECTED', reviewStatus: 'REJECTED' },
      reviewed: { status: 'PAYMENT_REVIEWED', reviewStatus: 'APPROVED' },
      cancel: { status: 'CANCELLED', reviewStatus: order.paymentReviewStatus },
    };
    const next = statusMap[action];
    if (!next) return handleError(new Error('إجراء غير صالح'));

    const updated = await prisma.shopOrder.update({
      where: { id: params.id },
      data: {
        status: next.status,
        paymentReviewStatus: next.reviewStatus,
        reviewerNotes: notes || order.reviewerNotes,
        reviewedById: dbUser.id,
        reviewedAt: new Date(),
      },
      include: { items: true, branch: true, reviewer: true },
    });

    if (order.authUserId) {
      await prisma.notification.create({
        data: {
          userId: order.authUserId,
          type: next.status === 'APPROVED' ? 'INFO' : 'SYSTEM',
          title: 'تحديث حالة الطلب',
          titleAr: 'تحديث حالة الطلب',
          message: `Order ${updated.orderNumber} status changed to ${updated.status}`,
          messageAr: `تم تغيير حالة الطلب ${updated.orderNumber} إلى ${updated.status}`,
          data: { orderId: updated.id, status: updated.status, event: 'SHOP_ORDER_STATUS_CHANGED' },
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: null,
        type: 'SYSTEM',
        title: 'تحديث طلب تطبيق',
        titleAr: 'تحديث طلب تطبيق',
        message: `Order ${updated.orderNumber} changed to ${updated.status}`,
        messageAr: `تم تغيير حالة الطلب ${updated.orderNumber} إلى ${updated.status}`,
        data: { orderId: updated.id, status: updated.status, event: 'SHOP_ORDER_STATUS_CHANGED' },
      },
    });

    await audit(dbUser.id, action.toUpperCase(), 'shop_order', updated.id, { status: updated.status, notes });
    return ok(updated);
  } catch (error) {
    return handleError(error, 'PATCH /api/app-orders/:id');
  }
}
