"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.PATCH = PATCH;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
const zod_1 = require("zod");
async function GET(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const { searchParams } = req.nextUrl;
    const branchId = searchParams.get('branchId') || dbUser.branchId || undefined;
    const lowStock = searchParams.get('lowStock') === 'true';
    const where = {};
    if (branchId)
        where.branchId = branchId;
    if (lowStock)
        where.quantity = { lte: prisma_1.prisma.inventory.fields.minStock };
    const data = await prisma_1.prisma.inventory.findMany({
        where,
        include: {
            product: {
                include: { category: { select: { id: true, name: true, nameAr: true, color: true } } },
            },
            branch: { select: { id: true, name: true, nameAr: true } },
        },
        orderBy: { product: { name: 'asc' } },
    });
    return (0, api_utils_1.ok)(data);
}
async function PATCH(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    try {
        const body = zod_1.z.object({
            productId: zod_1.z.string(),
            branchId: zod_1.z.string(),
            quantity: zod_1.z.number().int().nonnegative(),
            minStock: zod_1.z.number().int().nonnegative().optional(),
        }).parse(await req.json());
        const inv = await prisma_1.prisma.inventory.upsert({
            where: { productId_branchId: { productId: body.productId, branchId: body.branchId } },
            create: body,
            update: { quantity: body.quantity, ...(body.minStock !== undefined ? { minStock: body.minStock } : {}) },
        });
        return (0, api_utils_1.ok)(inv);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map