"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.PATCH = PATCH;
exports.DELETE = DELETE;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
const validations_1 = require("@/lib/validations");
async function GET(_, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: params.id },
        include: { branch: true, _count: { select: { sales: true } } },
    });
    if (!user)
        return (0, api_utils_1.notFound)('User');
    return (0, api_utils_1.ok)(user);
}
async function PATCH(req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    try {
        const body = validations_1.updateUserSchema.parse(await req.json());
        const user = await prisma_1.prisma.user.update({
            where: { id: params.id },
            data: body,
            include: { branch: true },
        });
        await (0, api_utils_1.audit)(dbUser.id, 'UPDATE', 'user', params.id, body);
        return (0, api_utils_1.ok)(user);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
async function DELETE(_, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('OWNER');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role !== 'OWNER')
        return (0, api_utils_1.forbidden)();
    if (params.id === dbUser.id)
        return (0, api_utils_1.forbidden)('Cannot deactivate yourself');
    try {
        const user = await prisma_1.prisma.user.update({
            where: { id: params.id },
            data: { isActive: false },
        });
        await (0, api_utils_1.audit)(dbUser.id, 'DEACTIVATE', 'user', params.id);
        return (0, api_utils_1.ok)(user);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map