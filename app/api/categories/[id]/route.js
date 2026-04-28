"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.PUT = PUT;
exports.DELETE = DELETE;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
const validations_1 = require("@/lib/validations");
async function PUT(req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    try {
        const body = validations_1.categorySchema.partial().parse(await req.json());
        const cat = await prisma_1.prisma.category.update({ where: { id: params.id }, data: body });
        return (0, api_utils_1.ok)(cat);
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
    try {
        await prisma_1.prisma.category.delete({ where: { id: params.id } });
        return (0, api_utils_1.ok)({ message: 'Deleted' });
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map