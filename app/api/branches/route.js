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
async function GET() {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const data = await prisma_1.prisma.branch.findMany({
        where: { isActive: true },
        include: { _count: { select: { users: true, sales: true } } },
        orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    });
    return (0, api_utils_1.ok)(data);
}
async function POST(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('OWNER');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role !== 'OWNER')
        return (0, api_utils_1.forbidden)();
    try {
        const body = validations_1.branchSchema.parse(await req.json());
        const branch = await prisma_1.prisma.$transaction(async (tx) => {
            const b = await tx.branch.create({ data: body });
            // Create inventory records for all products in the new branch
            const products = await tx.product.findMany({ where: { isActive: true }, select: { id: true, minStock: true } });
            if (products.length > 0) {
                await tx.inventory.createMany({
                    data: products.map((p) => ({ productId: p.id, branchId: b.id, quantity: 0, minStock: p.minStock })),
                    skipDuplicates: true,
                });
            }
            return b;
        });
        return (0, api_utils_1.created)(branch);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map