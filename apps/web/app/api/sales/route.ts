import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthUser, ok, created, unauthorized, forbidden, handleError, audit,
  generateInvoiceNumber,
} from '@/lib/api-utils';
import { saleSchema } from '@/lib/validations';

// ─── List sales ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get('branchId') || dbUser.branchId || undefined;
  const status = searchParams.get('status') || undefined;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (dbUser.role === 'CASHIER') where.userId = dbUser.id;

  const [data, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        items: true,
        user: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, name: true, nameAr: true, phone: true } },
        branch: { select: { id: true, name: true, nameAr: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return ok({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}

// ─── Create sale ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  try {
    const body = saleSchema.parse(await req.json());

    // Check for duplicate offline sale
    if (body.offlineId) {
      const existing = await prisma.sale.findUnique({ where: { offlineId: body.offlineId } });
      if (existing) return ok({ ...existing, duplicate: true });
    }

    const invoiceNumber = await generateInvoiceNumber(body.branchId);

    const sale = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;
      let totalProfit = 0;

      // Validate & compute each item
      const enrichedItems = await Promise.all(
        body.items.map(async (item) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { costPrice: true, name: true, nameAr: true, barcode: true },
          });

          const costPrice = item.costPrice || product?.costPrice || 0;
          const base = item.unitPrice * item.quantity;
          const discountAmt = item.discountAmount || (base * (item.discountPercent || 0)) / 100;
          const afterDiscount = base - discountAmt;
          const taxAmt = (afterDiscount * item.taxRate) / 100;
          const total = afterDiscount + taxAmt;
          const profit = (item.unitPrice - costPrice) * item.quantity - discountAmt;

          subtotal += base;
          totalTax += taxAmt;
          totalProfit += profit;

          // Deduct inventory — lock row to prevent concurrent oversell
          const [inv] = await tx.$queryRaw<
            Array<{ id: string; quantity: number; minStock: number }>
          >`
            SELECT id, quantity, "minStock"
            FROM "Inventory"
            WHERE "productId" = ${item.productId} AND "branchId" = ${body.branchId}
            FOR UPDATE
          `;

          if (!inv || inv.quantity < item.quantity) {
            const productLabel = product?.nameAr || product?.name || item.name;
            throw new Error(
              `مخزون غير كافٍ للمنتج ${productLabel}. المتاح: ${inv?.quantity ?? 0}`,
            );
          }

          const newQty = inv.quantity - item.quantity;
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: newQty },
          });

          // Low-stock alert — only if no unread alert already exists for this product
          if (newQty <= inv.minStock) {
            const existingAlert = await tx.notification.findFirst({
              where: {
                type: 'LOW_STOCK',
                isRead: false,
                data: { path: ['productId'], equals: item.productId },
              },
            });
            if (!existingAlert) {
              const productLabel = product?.nameAr || product?.name || item.name;
              await tx.notification.create({
                data: {
                  type: 'LOW_STOCK',
                  title: 'Low Stock Alert',
                  titleAr: 'تنبيه مخزون منخفض',
                  message: `${productLabel} is running low (${newQty} remaining)`,
                  messageAr: `${productLabel} وصل إلى مستوى منخفض (${newQty} متبقي)`,
                  data: { productId: item.productId, quantity: newQty, branchId: body.branchId },
                },
              });
            }
          }

          return {
            productId: item.productId,
            name: item.name || product?.name || '',
            nameAr: item.nameAr || product?.nameAr,
            barcode: item.barcode || product?.barcode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice,
            discountAmount: discountAmt,
            discountPercent: item.discountPercent || 0,
            taxRate: item.taxRate,
            taxAmount: taxAmt,
            total,
            profit,
          };
        }),
      );

      // Invoice-level discount
      const invoiceDisc = body.discountAmount || (subtotal * (body.discountPercent || 0)) / 100;
      const finalTotal = subtotal - invoiceDisc + totalTax;
      const changeAmount = Math.max(0, body.paidAmount - finalTotal);

      // Update customer loyalty
      if (body.customerId) {
        await tx.customer.update({
          where: { id: body.customerId },
          data: {
            loyaltyPoints: { increment: Math.floor(finalTotal / 10) },
            totalSpent: { increment: finalTotal },
          },
        });
      }

      return tx.sale.create({
        data: {
          invoiceNumber,
          offlineId: body.offlineId,
          branchId: body.branchId,
          userId: dbUser.id,
          customerId: body.customerId,
          paymentMethod: body.paymentMethod as any,
          subtotal,
          discountAmount: invoiceDisc,
          taxAmount: totalTax,
          total: finalTotal,
          profit: totalProfit - invoiceDisc,
          paidAmount: body.paidAmount,
          changeAmount,
          notes: body.notes,
          items: { createMany: { data: enrichedItems } },
        },
        include: {
          items: true,
          customer: { select: { id: true, name: true, phone: true } },
          branch: { select: { id: true, name: true, nameAr: true } },
        },
      });
    });

    await audit(dbUser.id, 'CREATE', 'sale', sale.id, { total: sale.total, invoiceNumber });
    return created(sale);
  } catch (e) {
    return handleError(e);
  }
}
