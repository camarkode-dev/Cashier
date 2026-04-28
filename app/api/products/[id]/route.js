"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.PUT = PUT;
exports.PATCH = PATCH;
exports.DELETE = DELETE;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
const validations_1 = require("@/lib/validations");
async function GET(_req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const product = await prisma_1.prisma.product.findUnique({
        where: { id: params.id },
        include: {
            category: true,
            inventory: { include: { branch: { select: { id: true, name: true, nameAr: true } } } },
        },
    });
    if (!product)
        return (0, api_utils_1.notFound)('Product');
    return (0, api_utils_1.ok)(product);
}
async function PUT(req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    try {
        const body = validations_1.productUpdateSchema.parse(await req.json());
        const { initialStock: _, branchId: __, ...data } = body;
        const product = await prisma_1.prisma.product.update({
            where: { id: params.id },
            data,
            include: { category: true },
        });
        await (0, api_utils_1.audit)(dbUser.id, 'UPDATE', 'product', product.id, data);
        return (0, api_utils_1.ok)(product);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
async function PATCH(req, { params }) {
    return PUT(req, { params });
}
async function DELETE(_req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('OWNER');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role !== 'OWNER')
        return (0, api_utils_1.forbidden)();
    try {
        await prisma_1.prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
        await (0, api_utils_1.audit)(dbUser.id, 'DELETE', 'product', params.id);
        return (0, api_utils_1.ok)({ message: 'تم حذف المنتج' });
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map