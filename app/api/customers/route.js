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
    const search = searchParams.get('search') || '';
    const phone = searchParams.get('phone') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const where = {};
    if (phone)
        where.phone = { contains: phone };
    if (search)
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { nameAr: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    const [data, total] = await Promise.all([
        prisma_1.prisma.customer.findMany({
            where, orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit, take: limit,
            include: { _count: { select: { sales: true } } },
        }),
        prisma_1.prisma.customer.count({ where }),
    ]);
    return (0, api_utils_1.ok)({ data, meta: { total, page, limit } });
}
async function POST(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    try {
        const body = validations_1.customerSchema.parse(await req.json());
        const customer = await prisma_1.prisma.customer.create({ data: body });
        return (0, api_utils_1.created)(customer);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map