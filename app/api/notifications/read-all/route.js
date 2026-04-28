"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.PATCH = PATCH;
exports.dynamic = 'force-dynamic';
const api_utils_1 = require("@/lib/api-utils");
const prisma_1 = require("@/lib/prisma");
async function PATCH() {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    await prisma_1.prisma.notification.updateMany({
        where: { OR: [{ userId: dbUser.id }, { userId: null }], isRead: false },
        data: { isRead: true },
    });
    return (0, api_utils_1.ok)({ message: 'All marked as read' });
}
//# sourceMappingURL=route.js.map