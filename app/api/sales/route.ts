export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthUser,
  ok,
  created,
  unauthorized,
  handleError,
  audit,
  generateInvoiceNumber,
  generateCreditInvoiceNumber,
} from '@/lib/api-utils';
import { saleSchema } from '@/lib/validations';
import { extractPaymentReceiptImage, stripPaymentReceiptImage } from '@/lib/payment-receipt';

function parseReferenceNumber(notes?: string | null) {
  if (!notes) return undefined;
  const match = notes.match(/رقم المرجع:\s*([^\n|]+)/);
  return match?.[1]?.trim() || undefined;
}

function cleanPaymentNotes(notes?: string | null) {
  return stripPaymentReceiptImage(notes || undefined) || undefined;
}

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
        payments: { orderBy: { createdAt: 'asc' } },
        creditInvoice: {
          include: {
            payments: { orderBy: { createdAt: 'asc' } },
          },
        },
        user: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, name: true, nameAr: true, phone: true, accountBalance: true } },
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

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  try {
    const body = saleSchema.parse(await req.json());

    if (body.offlineId) {
      const existing = await prisma.sale.findUnique({ where: { offlineId: body.offlineId } });
      if (existing) return ok({ ...existing, duplicate: true });
    }

    const invoiceNumber = await generateInvoiceNumber(body.branchId);
    const paymentRows = body.payments && body.payments.length > 0
      ? body.payments
      : body.paymentMethod === 'SPLIT'
        ? []
        : [{
            method: body.paymentMethod,
            amount: body.paidAmount,
            notes: body.paymentNotes || body.notes,
          }];

    const sale = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;
      let totalProfit = 0;

      const enrichedItems = await Promise.all(
        body.items.map(async (item) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { costPrice: true, name: true, nameAr: true, barcode: true, returnDays: true },
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

          const [inv] = await tx.$queryRaw<Array<{ id: string; quantity: number; minStock: number }>>`
            SELECT id, quantity, "minStock"
            FROM "Inventory"
            WHERE "productId" = ${item.productId} AND "branchId" = ${body.branchId}
            FOR UPDATE
          `;

          if (!inv || inv.quantity < item.quantity) {
            const productLabel = product?.nameAr || product?.name || item.name;
            throw new Error(`المخزون غير كافٍ للمنتج ${productLabel}. المتاح: ${inv?.quantity ?? 0}`);
          }

          const newQty = inv.quantity - item.quantity;
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: newQty },
          });

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
            nameAr: item.nameAr || product?.nameAr || undefined,
            barcode: item.barcode || product?.barcode || undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice,
            discountAmount: discountAmt,
            discountPercent: item.discountPercent || 0,
            taxRate: item.taxRate,
            taxAmount: taxAmt,
            total,
            profit,
            returnDays: product?.returnDays ?? 7,
          };
        }),
      );

      const invoiceDisc = body.discountAmount || (subtotal * (body.discountPercent || 0)) / 100;
      const finalTotal = subtotal - invoiceDisc + totalTax;
      const paymentTotal = paymentRows.reduce((sum, row) => sum + row.amount, 0);
      const changeAmount = Math.max(0, paymentTotal - finalTotal);
      const customerId = body.customerId || null;

      if (body.paymentMethod === 'CREDIT' && !customerId) {
        throw new Error('يجب اختيار العميل قبل حفظ فاتورة آجل');
      }
      if (body.paymentMethod !== 'CREDIT' && paymentTotal < finalTotal) {
        throw new Error('المبلغ المدفوع أقل من إجمالي الفاتورة');
      }
      if (body.paymentMethod === 'SPLIT' && Math.abs(paymentTotal - finalTotal) > 0.01) {
        throw new Error('إجمالي طرق الدفع المقسمة يجب أن يساوي إجمالي الفاتورة');
      }

      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: Math.floor(finalTotal / 10) },
            totalSpent: { increment: finalTotal },
          },
        });
      }

      const saleStatus = body.paymentMethod === 'CREDIT' && paymentTotal < finalTotal ? 'PARTIAL' : 'COMPLETED';
      const salePaidAmount = body.paymentMethod === 'CREDIT' ? body.paidAmount : paymentTotal;

      const createdSale = await tx.sale.create({
        data: {
          invoiceNumber,
          offlineId: body.offlineId,
          branchId: body.branchId,
          userId: dbUser.id,
          customerId,
          status: saleStatus as any,
          paymentMethod: body.paymentMethod as any,
          subtotal,
          discountAmount: invoiceDisc,
          taxAmount: totalTax,
          total: finalTotal,
          profit: totalProfit - invoiceDisc,
          paidAmount: salePaidAmount,
          changeAmount,
          notes: body.notes,
          items: { createMany: { data: enrichedItems } },
          payments: body.paymentMethod === 'CREDIT'
            ? undefined
            : {
                create: paymentRows.map((row) => ({
                  amount: row.amount,
                  method: row.method as any,
                  notes: cleanPaymentNotes(row.notes),
                  referenceNumber: parseReferenceNumber(row.notes),
                  receiptImage: extractPaymentReceiptImage(row.notes),
                })),
              },
        },
      });

      if (body.paymentMethod === 'CREDIT' && customerId) {
        const creditInvoiceNumber = await generateCreditInvoiceNumber();
        const remainingAmount = Math.max(0, finalTotal - salePaidAmount);
        const creditInvoice = await tx.creditInvoice.create({
          data: {
            invoiceNumber: creditInvoiceNumber,
            saleId: createdSale.id,
            branchId: body.branchId,
            customerId,
            userId: dbUser.id,
            totalAmount: finalTotal,
            paidAmount: salePaidAmount,
            remainingAmount,
            status: remainingAmount > 0 ? (salePaidAmount > 0 ? 'PARTIAL' : 'UNPAID') : 'PAID',
            notes: body.notes,
          },
        });

        await tx.customer.update({
          where: { id: customerId },
          data: {
            accountBalance: { increment: remainingAmount },
          },
        });

        await tx.customerTransaction.create({
          data: {
            customerId,
            creditInvoiceId: creditInvoice.id,
            saleId: createdSale.id,
            type: 'SALE_DEBT',
            debit: remainingAmount,
            credit: 0,
            balanceAfter: remainingAmount,
            notes: body.notes || 'فاتورة آجل',
            cashierId: dbUser.id,
          },
        });
      }

      const response = await tx.sale.findUnique({
        where: { id: createdSale.id },
        include: {
          items: true,
          payments: { orderBy: { createdAt: 'asc' } },
          creditInvoice: {
            include: { payments: { orderBy: { createdAt: 'asc' } } },
          },
          customer: { select: { id: true, name: true, phone: true, accountBalance: true } },
          branch: { select: { id: true, name: true, nameAr: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!response) throw new Error('تعذر إنشاء الفاتورة');
      return response;
    });

    await audit(dbUser.id, 'CREATE', 'sale', sale.id, {
      total: sale.total,
      invoiceNumber,
      paymentMethod: sale.paymentMethod,
    });
    return created(sale);
  } catch (e) {
    return handleError(e);
  }
}
