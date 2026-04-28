"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function GET(req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const branchId = req.nextUrl.searchParams.get('branchId') || dbUser.branchId || undefined;
    const product = await prisma_1.prisma.product.findFirst({
        where: { barcode: params.barcode, isActive: true },
        include: {
            category: true,
            inventory: branchId ? { where: { branchId }, take: 1 } : { take: 1 },
        },
    });
    if (!product)
        return (0, api_utils_1.notFound)('Product');
    return (0, api_utils_1.ok)(product);
}
//# sourceMappingURL=route.js.map