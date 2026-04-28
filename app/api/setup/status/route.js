"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const server_2 = require("@/lib/supabase/server");
const prisma_1 = require("@/lib/prisma");
async function GET() {
    try {
        const [tenantCount, userCount] = await Promise.all([
            prisma_1.prisma.tenant.count(),
            prisma_1.prisma.user.count(),
        ]);
        const hasTenant = tenantCount > 0;
        const hasUser = userCount > 0;
        // Check if the current Supabase session user has a DB record
        let currentUserProvisioned = false;
        try {
            const supabase = await (0, server_2.createClient)();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const dbUser = await prisma_1.prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
                currentUserProvisioned = !!dbUser;
            }
        }
        catch { }
        return server_1.NextResponse.json({
            success: true,
            data: {
                needsSetup: !hasTenant,
                hasTenant,
                hasUser,
                currentUserProvisioned,
            },
        });
    }
    catch {
        // DB unreachable — don't block setup page
        return server_1.NextResponse.json({
            success: true,
            data: { needsSetup: true, hasTenant: false, hasUser: false, currentUserProvisioned: false },
        });
    }
}
//# sourceMappingURL=route.js.map