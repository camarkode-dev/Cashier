"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.dynamic = 'force-dynamic';
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function GET() {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const branchId = dbUser.branchId || undefined;
    const where = {};
    if (branchId)
        where.branchId = branchId;
    const summary = await prisma_1.prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
    });
    const totalAmount = summary.reduce((sum, item) => sum + (item._sum.amount || 0), 0);
    return (0, api_utils_1.ok)({ totalAmount, byCategory: summary });
}
//# sourceMappingURL=route.js.map