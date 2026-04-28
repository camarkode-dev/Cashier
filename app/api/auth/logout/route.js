"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
exports.dynamic = 'force-dynamic';
const server_1 = require("@/lib/supabase/server");
const api_utils_1 = require("@/lib/api-utils");
async function POST() {
    try {
        const supabase = await (0, server_1.createClient)();
        await supabase.auth.signOut();
        return (0, api_utils_1.ok)({ message: 'Logged out' });
    }
    catch (e) {
        return (0, api_utils_1.serverError)(e);
    }
}
//# sourceMappingURL=route.js.map