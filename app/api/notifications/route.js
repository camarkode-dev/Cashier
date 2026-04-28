"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.DELETE = DELETE;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function GET(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);
    const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';
    const where = { OR: [{ userId: dbUser.id }, { userId: null }] };
    if (unreadOnly)
        where.isRead = false;
    const [data, unreadCount] = await Promise.all([
        prisma_1.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        }),
        prisma_1.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);
    return (0, api_utils_1.ok)({ data, unreadCount });
}
async function DELETE() {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    await prisma_1.prisma.notification.deleteMany({ where: { OR: [{ userId: dbUser.id }, { userId: null }] } });
    return (0, api_utils_1.ok)({ message: 'Cleared' });
}
//# sourceMappingURL=route.js.map