"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.POST = POST;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
const validations_1 = require("@/lib/validations");
const api_utils_2 = require("@/lib/api-utils");
async function GET(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    const { searchParams } = req.nextUrl;
    const branchId = searchParams.get('branchId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const where = {};
    if (branchId)
        where.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];
    const [data, total] = await Promise.all([
        prisma_1.prisma.stockTransfer.findMany({
            where,
            include: {
                fromBranch: { select: { id: true, name: true, nameAr: true } },
                toBranch: { select: { id: true, name: true, nameAr: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                items: { include: { product: { select: { id: true, name: true, nameAr: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.prisma.stockTransfer.count({ where }),
    ]);
    return (0, api_utils_1.ok)({ data, meta: { total, page, limit } });
}
async function POST(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    try {
        const body = validations_1.stockTransferSchema.parse(await req.json());
        if (body.fromBranchId === body.toBranchId) {
            return (0, api_utils_2.err)('الفرع المصدر والوجهة متطابقان', 400);
        }
        const [product, fromInv, toInv] = await Promise.all([
            prisma_1.prisma.product.findFirst({ where: { id: body.productId, isActive: true } }),
            prisma_1.prisma.inventory.findFirst({ where: { productId: body.productId, branchId: body.fromBranchId } }),
            prisma_1.prisma.inventory.findFirst({ where: { productId: body.productId, branchId: body.toBranchId } }),
        ]);
        if (!product)
            return (0, api_utils_2.err)('المنتج غير موجود', 404);
        if (!fromInv || fromInv.quantity < body.quantity) {
            return (0, api_utils_2.err)(`مخزون غير كافٍ. المتاح: ${fromInv?.quantity ?? 0}`, 400);
        }
        const transfer = await prisma_1.prisma.$transaction(async (tx) => {
            await tx.inventory.update({
                where: { id: fromInv.id },
                data: { quantity: { decrement: body.quantity } },
            });
            if (toInv) {
                await tx.inventory.update({ where: { id: toInv.id }, data: { quantity: { increment: body.quantity } } });
            }
            else {
                await tx.inventory.create({
                    data: { productId: body.productId, branchId: body.toBranchId, quantity: body.quantity },
                });
            }
            const t = await tx.stockTransfer.create({
                data: {
                    fromBranchId: body.fromBranchId,
                    toBranchId: body.toBranchId,
                    notes: body.notes,
                    createdById: dbUser.id,
                    status: 'COMPLETED',
                    items: { create: [{ productId: body.productId, quantity: body.quantity, costPrice: product.costPrice }] },
                },
                include: {
                    fromBranch: { select: { name: true, nameAr: true } },
                    toBranch: { select: { name: true, nameAr: true } },
                    items: { include: { product: { select: { name: true, nameAr: true } } } },
                },
            });
            // Notify
            await tx.notification.create({
                data: {
                    type: 'STOCK_TRANSFER',
                    title: 'Stock Transfer Completed',
                    titleAr: 'تم نقل المخزون',
                    message: `Transferred ${body.quantity} units of ${product.nameAr || product.name}`,
                    messageAr: `تم نقل ${body.quantity} وحدة من ${product.nameAr || product.name}`,
                    data: { transferId: t.id, quantity: body.quantity },
                },
            });
            return t;
        });
        await (0, api_utils_1.audit)(dbUser.id, 'CREATE', 'stock_transfer', transfer.id, { quantity: body.quantity, productId: body.productId });
        return (0, api_utils_1.created)(transfer);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map