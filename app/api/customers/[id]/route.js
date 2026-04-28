"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.PUT = PUT;
exports.DELETE = DELETE;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
const validations_1 = require("@/lib/validations");
async function GET(_, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const customer = await prisma_1.prisma.customer.findUnique({
        where: { id: params.id },
        include: { sales: { orderBy: { createdAt: 'desc' }, take: 20, include: { items: true } } },
    });
    if (!customer)
        return (0, api_utils_1.notFound)('Customer');
    return (0, api_utils_1.ok)(customer);
}
async function PUT(req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    try {
        const body = validations_1.customerSchema.partial().parse(await req.json());
        const customer = await prisma_1.prisma.customer.update({ where: { id: params.id }, data: body });
        return (0, api_utils_1.ok)(customer);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
async function DELETE(_, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    try {
        await prisma_1.prisma.customer.delete({ where: { id: params.id } });
        return (0, api_utils_1.ok)({ message: 'Deleted' });
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map