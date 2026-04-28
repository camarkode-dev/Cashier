"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.DELETE = DELETE;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function DELETE(req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    const expense = await prisma_1.prisma.expense.findUnique({ where: { id: params.id } });
    if (!expense || expense.branchId !== dbUser.branchId)
        return (0, api_utils_1.notFound)('Expense');
    await prisma_1.prisma.expense.delete({ where: { id: params.id } });
    return (0, api_utils_1.ok)({ message: 'Deleted' });
}
//# sourceMappingURL=route.js.map