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
    const data = await prisma_1.prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
    return (0, api_utils_1.ok)(data);
}
async function POST(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    try {
        const body = validations_1.categorySchema.parse(await req.json());
        const cat = await prisma_1.prisma.category.create({ data: body });
        return (0, api_utils_1.created)(cat);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map