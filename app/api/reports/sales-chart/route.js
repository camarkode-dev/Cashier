"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function GET(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const period = req.nextUrl.searchParams.get('period') || 'daily';
    const branchId = req.nextUrl.searchParams.get('branchId') || dbUser.branchId || undefined;
    const now = new Date();
    let startDate;
    let groupBy;
    switch (period) {
        case 'weekly':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
            groupBy = 'day';
            break;
        case 'monthly':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
            groupBy = 'month';
            break;
        default: // daily
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
            groupBy = 'day';
    }
    const where = {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
        ...(branchId ? { branchId } : {}),
    };
    const sales = await prisma_1.prisma.sale.findMany({
        where,
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    });
    // Group sales by period
    const chartData = sales.reduce((acc, sale) => {
        let key;
        const date = new Date(sale.createdAt);
        if (groupBy === 'month') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        else {
            key = date.toISOString().split('T')[0];
        }
        if (!acc[key]) {
            acc[key] = { date: key, sales: 0, revenue: 0 };
        }
        acc[key].sales += 1;
        acc[key].revenue += Number(sale.total);
        return acc;
    }, {});
    return (0, api_utils_1.ok)(Object.values(chartData));
}
//# sourceMappingURL=route.js.map