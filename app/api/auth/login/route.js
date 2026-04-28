"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const server_2 = require("@/lib/supabase/server");
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
const validations_1 = require("@/lib/validations");
async function POST(req) {
    try {
        const body = validations_1.loginSchema.parse(await req.json());
        const supabase = await (0, server_2.createClient)();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: body.email,
            password: body.password,
        });
        if (error) {
            return (0, api_utils_1.unauthorized)('بيانات الدخول غير صحيحة');
        }
        try {
            const dbUser = await prisma_1.prisma.user.findUnique({
                where: { id: data.user.id },
                include: { branch: true },
            });
            if (!dbUser || !dbUser.isActive) {
                await supabase.auth.signOut();
                return (0, api_utils_1.unauthorized)('الحساب غير نشط');
            }
            await prisma_1.prisma.user.update({
                where: { id: dbUser.id },
                data: { updatedAt: new Date() },
            });
            return (0, api_utils_1.ok)({ user: dbUser, session: data.session });
        }
        catch (error) {
            if ((0, api_utils_1.isDatabaseUnavailableError)(error)) {
                await supabase.auth.signOut();
                return (0, api_utils_1.serviceUnavailable)('Database connection is unavailable');
            }
            throw error;
        }
    }
    catch (error) {
        return (0, api_utils_1.handleError)(error, 'POST /api/auth/login');
    }
}
//# sourceMappingURL=route.js.map