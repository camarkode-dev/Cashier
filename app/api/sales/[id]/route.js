"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.PATCH = PATCH;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function GET(_req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const sale = await prisma_1.prisma.sale.findUnique({
        where: { id: params.id },
        include: {
            items: { include: { product: { select: { id: true, name: true, nameAr: true, image: true } } } },
            user: { select: { id: true, firstName: true, lastName: true } },
            customer: true,
            branch: { select: { id: true, name: true, nameAr: true } },
        },
    });
    if (!sale)
        return (0, api_utils_1.notFound)('Sale');
    // Cashier can only view own sales
    if (dbUser.role === 'CASHIER' && sale.userId !== dbUser.id)
        return (0, api_utils_1.forbidden)();
    return (0, api_utils_1.ok)(sale);
}
async function PATCH(req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const { action } = await req.json();
    if (action !== 'refund' && action !== 'void') {
        return (0, api_utils_1.handleError)(new Error('Invalid action'));
    }
    try {
        const sale = await prisma_1.prisma.sale.findUnique({
            where: { id: params.id },
            include: { items: true },
        });
        if (!sale)
            return (0, api_utils_1.notFound)('Sale');
        if (sale.status !== 'COMPLETED') {
            return (0, api_utils_1.handleError)(new Error('Sale is not in COMPLETED status'));
        }
        const newStatus = action === 'refund' ? 'REFUNDED' : 'VOID';
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            // Restore inventory on refund
            if (action === 'refund') {
                for (const item of sale.items) {
                    await tx.inventory.updateMany({
                        where: { productId: item.productId, branchId: sale.branchId },
                        data: { quantity: { increment: item.quantity } },
                    });
                }
                // Reverse loyalty points
                if (sale.customerId) {
                    await tx.customer.update({
                        where: { id: sale.customerId },
                        data: {
                            loyaltyPoints: { decrement: Math.floor(sale.total / 10) },
                            totalSpent: { decrement: sale.total },
                        },
                    });
                }
            }
            return tx.sale.update({
                where: { id: params.id },
                data: { status: newStatus },
                include: { items: true },
            });
        });
        await (0, api_utils_1.audit)(dbUser.id, action.toUpperCase(), 'sale', params.id);
        return (0, api_utils_1.ok)(updated);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map