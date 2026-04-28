"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.PATCH = PATCH;
exports.DELETE = DELETE;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function PATCH(_, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    try {
        const n = await prisma_1.prisma.notification.update({ where: { id: params.id }, data: { isRead: true } });
        return (0, api_utils_1.ok)(n);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
async function DELETE(_, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    try {
        await prisma_1.prisma.notification.delete({ where: { id: params.id } });
        return (0, api_utils_1.ok)({ message: 'Deleted' });
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map