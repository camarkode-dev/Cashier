"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.POST = POST;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const server_2 = require("@/lib/supabase/server");
const api_utils_1 = require("@/lib/api-utils");
const validations_1 = require("@/lib/validations");
async function GET(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)('ADMIN');
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    if (dbUser.role === 'CASHIER')
        return (0, api_utils_1.forbidden)();
    const { searchParams } = req.nextUrl;
    const role = searchParams.get('role') || undefined;
    const branchId = searchParams.get('branchId') || undefined;
    const data = await prisma_1.prisma.user.findMany({
        where: { ...(role ? { role: role } : {}), ...(branchId ? { branchId } : {}) },
        include: { branch: { select: { id: true, name: true, nameAr: true } } },
        orderBy: { createdAt: 'desc' },
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
        const body = validations_1.createUserSchema.parse(await req.json());
        // Create Supabase auth user
        const supabase = await (0, server_2.createClient)();
        const { data: authData, error: authErr } = await supabase.auth.admin?.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
        }) ?? {};
        if (authErr || !authData?.user) {
            return (0, api_utils_1.handleError)(authErr || new Error('Failed to create auth user'));
        }
        // Create database user record
        const user = await prisma_1.prisma.user.create({
            data: {
                id: authData.user.id,
                email: body.email,
                firstName: body.firstName,
                lastName: body.lastName,
                role: body.role,
                branchId: body.branchId,
                phone: body.phone,
            },
            include: { branch: true },
        });
        await (0, api_utils_1.audit)(dbUser.id, 'CREATE', 'user', user.id, { role: user.role, email: user.email });
        return (0, api_utils_1.created)(user);
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map