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
async function GET(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || undefined;
    const branchId = searchParams.get('branchId') || dbUser.branchId || undefined;
    const withInventory = searchParams.get('withInventory') === 'true';
    const lowStock = searchParams.get('lowStock') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const where = { isActive: true };
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { nameAr: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search } },
            { sku: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (categoryId)
        where.categoryId = categoryId;
    if (lowStock && branchId) {
        where.inventory = { some: { branchId, quantity: { lte: prisma_1.prisma.inventory.fields.minStock } } };
    }
    const [data, total] = await Promise.all([
        prisma_1.prisma.product.findMany({
            where,
            include: {
                category: true,
                inventory: withInventory
                    ? { where: branchId ? { branchId } : undefined }
                    : branchId
                        ? { where: { branchId }, take: 1 }
                        : false,
            },
            orderBy: { name: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.prisma.product.count({ where }),
    ]);
    return (0, api_utils_1.ok)({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}
async function POST(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    try {
        const body = validations_1.productSchema.parse(await req.json());
        const { initialStock = 0, branchId: reqBranchId, ...productData } = body;
        const targetBranch = reqBranchId || dbUser.branchId;
        const product = await prisma_1.prisma.$transaction(async (tx) => {
            const p = await tx.product.create({ data: productData, include: { category: true } });
            // Auto-create inventory for all branches
            const branches = await tx.branch.findMany({ select: { id: true } });
            await tx.inventory.createMany({
                data: branches.map((b) => ({
                    productId: p.id,
                    branchId: b.id,
                    quantity: b.id === targetBranch ? initialStock : 0,
                    minStock: productData.minStock ?? 5,
                })),
                skipDuplicates: true,
            });
            return p;
        });
        await (0, api_utils_1.audit)(dbUser.id, 'CREATE', 'product', product.id, { name: product.name });
        return (0, api_utils_1.created)(product);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map