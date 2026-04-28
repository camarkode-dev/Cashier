"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function GET(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('OWNER');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role !== 'OWNER')
        return (0, api_utils_1.forbidden)();
    const { searchParams } = req.nextUrl;
    const entity = searchParams.get('entity') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const where = {};
    if (entity)
        where.entity = entity;
    if (userId)
        where.userId = userId;
    const [data, total] = await Promise.all([
        prisma_1.prisma.auditLog.findMany({
            where,
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.prisma.auditLog.count({ where }),
    ]);
    return (0, api_utils_1.ok)({ data, meta: { total, page, limit } });
}
//# sourceMappingURL=route.js.map