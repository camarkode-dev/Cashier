export const dynamic = 'force-dynamic';
import { type NotificationType } from '@prisma/client';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ok, unauthorized, handleError, created } from '@/lib/api-utils';
import { shopCheckoutSchema } from '@/lib/validations';
import { uploadShopReceiptImage } from '@/lib/shop-storage';

async function getShopAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user || null;
}

async function ensureCustomerRecord(data: {
  name: string;
  email: string;
  phone?: string | null;
}) {
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { email: data.email },
        ...(data.phone ? [{ phone: data.phone }] : []),
      ],
    },
  });
  if (customer) return customer;
  return prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
    },
  });
}

export async function GET(req: NextRequest) {
  const user = await getShopAuthUser();
  if (!user) return unauthorized();

  try {
    const orders = await prisma.shopOrder.findMany({
      where: { authUserId: user.id },
      include: {
        items: true,
        branch: { select: { id: true, name: true, nameAr: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ data: orders });
  } catch (error) {
    return handleError(error, 'GET /api/shop/orders');
  }
}

export async function POST(req: NextRequest) {
  const user = await getShopAuthUser();
  if (!user) return unauthorized();

  try {
    const isFormData = req.headers.get('content-type')?.includes('multipart/form-data');
    const payload = isFormData ? await req.formData() : null;
    const body = payload
      ? JSON.parse(String(payload.get('payload') || '{}'))
      : await req.json();

    const validated = shopCheckoutSchema.parse(body);
    const receiptFiles = payload
      ? payload.getAll('receiptFiles').filter((value): value is File => value instanceof File)
      : [];

    const customer = await ensureCustomerRecord({
      name: validated.customerName,
      email: validated.customerEmail,
      phone: validated.customerPhone,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: validated.items.map((item) => item.productId) }, isActive: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
        price: true,
        compareAtPrice: true,
        taxRate: true,
        image: true,
        categoryId: true,
      },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));
    for (const item of validated.items) {
      if (!productMap.has(item.productId)) {
        throw new Error(`Product ${item.productId} is unavailable`);
      }
    }

    const subtotalBeforeInstallment = validated.items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      const basePrice = product?.compareAtPrice && product.compareAtPrice > (product?.price || 0)
        ? product.compareAtPrice
        : product?.price || 0;
      return sum + basePrice * item.quantity;
    }, 0);

    const discountAmount = validated.items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      if (!product?.compareAtPrice || product.compareAtPrice <= (product.price || 0)) return sum;
      return sum + (product.compareAtPrice - product.price) * item.quantity;
    }, 0);

    const taxAmount = validated.items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      const rate = product?.taxRate || 0;
      return sum + (product?.price || 0) * item.quantity * (rate / 100);
    }, 0);
    const installmentPercentage = validated.installmentPercentage || 0;
    const installmentAmount = ((subtotalBeforeInstallment - discountAmount + taxAmount) * installmentPercentage) / 100;
    const totalAfterInstallment = subtotalBeforeInstallment - discountAmount + taxAmount + installmentAmount;

    const uploadedReceipts: Awaited<ReturnType<typeof uploadShopReceiptImage>>[] = [];
    for (const file of receiptFiles) {
      if (!file.type.startsWith('image/')) {
        throw new Error('يجب أن تكون إيصالات الدفع صورًا فقط');
      }
      if (file.size > 7 * 1024 * 1024) {
        throw new Error('حجم الصورة أكبر من المسموح');
      }
      uploadedReceipts.push(await uploadShopReceiptImage(file));
    }

    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;

      const createdOrder = await tx.shopOrder.create({
        data: {
          orderNumber,
          authUserId: user.id,
          customerId: customer.id,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail,
          customerPhone: validated.customerPhone || null,
          paymentMethod: validated.paymentMethod as any,
          status: 'PENDING_PAYMENT_REVIEW',
          paymentReviewStatus: 'PENDING_PAYMENT_REVIEW',
          subtotalBeforeInstallment,
          installmentPercentage,
          installmentAmount,
          totalAfterInstallment,
          discountAmount,
          taxAmount,
          totalAmount: totalAfterInstallment,
          branchId: validated.branchId || null,
          notes: validated.notes || null,
          paymentReceiptImages: uploadedReceipts,
          items: {
            create: validated.items.map((item) => {
              const product = productMap.get(item.productId);
              const totalAmount = (product?.price || 0) * item.quantity;
              return {
                productId: product?.id || null,
                name: product?.name || '',
                nameAr: product?.nameAr || null,
                image: product?.image || null,
                quantity: item.quantity,
                unitPrice: product?.price || 0,
                totalAmount,
              };
            }),
          },
        },
        include: { items: true, customer: true, branch: true },
      });

      await tx.notification.createMany({
        data: [
          {
            userId: null,
            type: 'SYSTEM' as NotificationType,
            title: 'طلب جديد',
            titleAr: 'طلب جديد',
            message: `New shop order ${createdOrder.orderNumber}`,
            messageAr: `تم إنشاء طلب جديد رقم ${createdOrder.orderNumber}`,
            data: { orderId: createdOrder.id, event: 'SHOP_ORDER_CREATED' },
          },
          ...(uploadedReceipts.length
            ? [{
                userId: null,
                type: 'INFO' as NotificationType,
                title: 'تم رفع إيصال',
                titleAr: 'تم رفع إيصال',
                message: `Receipt uploaded for ${createdOrder.orderNumber}`,
                messageAr: `تم رفع إيصال للطلب ${createdOrder.orderNumber}`,
                data: { orderId: createdOrder.id, event: 'SHOP_RECEIPT_UPLOADED' },
              }]
            : []),
        ],
      });

      return createdOrder;
    });

    return created({ order });
  } catch (error) {
    return handleError(error, 'POST /api/shop/orders');
  }
}
