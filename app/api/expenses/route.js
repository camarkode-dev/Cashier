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
async function GET(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const { searchParams } = req.nextUrl;
    const branchId = searchParams.get('branchId') || dbUser.branchId || undefined;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 50;
    const where = {};
    if (branchId)
        where.branchId = branchId;
    if (from || to) {
        where.date = {};
        if (from)
            where.date.gte = new Date(from);
        if (to)
            where.date.lte = new Date(to);
    }
    const [data, total, summary] = await Promise.all([
        prisma_1.prisma.expense.findMany({ where, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma_1.prisma.expense.count({ where }),
        prisma_1.prisma.expense.groupBy({ by: ['category'], where, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
    ]);
    return (0, api_utils_1.ok)({ data, meta: { total, page, limit }, summary });
}
async function POST(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    try {
        const body = validations_1.expenseSchema.parse(await req.json());
        const expense = await prisma_1.prisma.expense.create({
            data: { ...body, date: body.date ? new Date(body.date) : new Date() },
        });
        return (0, api_utils_1.created)(expense);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map