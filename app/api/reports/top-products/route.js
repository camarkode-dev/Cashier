"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function GET(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    const { searchParams } = req.nextUrl;
    const from = searchParams.get('from') ? new Date(searchParams.get('from')) : new Date(new Date().setDate(1));
    const to = searchParams.get('to') ? new Date(searchParams.get('to')) : new Date();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const sortBy = searchParams.get('sortBy') || 'revenue'; // revenue | profit | quantity
    const saleItems = await prisma_1.prisma.saleItem.findMany({
        where: {
            sale: {
                status: 'COMPLETED',
                createdAt: { gte: from, lte: to },
            },
        },
        include: {
            product: { select: { id: true, name: true, nameAr: true, category: { select: { name: true, nameAr: true, color: true } } } },
        },
    });
    // Aggregate by product
    const productMap = new Map();
    for (const item of saleItems) {
        const key = item.productId;
        const existing = productMap.get(key) || {
            productId: key,
            name: item.name,
            nameAr: item.nameAr,
            category: item.product?.category,
            revenue: 0,
            profit: 0,
            quantity: 0,
            count: 0,
        };
        existing.revenue += item.total;
        existing.profit += item.profit;
        existing.quantity += item.quantity;
        existing.count += 1;
        productMap.set(key, existing);
    }
    let results = Array.from(productMap.values());
    if (sortBy === 'profit')
        results.sort((a, b) => b.profit - a.profit);
    else if (sortBy === 'quantity')
        results.sort((a, b) => b.quantity - a.quantity);
    else
        results.sort((a, b) => b.revenue - a.revenue);
    return (0, api_utils_1.ok)(results.slice(0, limit));
}
//# sourceMappingURL=route.js.map