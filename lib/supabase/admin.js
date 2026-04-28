"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminClient = createAdminClient;
const supabase_js_1 = require("@supabase/supabase-js");
function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || key === 'your-service-role-key')
        return null;
    return (0, supabase_js_1.createClient)(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
//# sourceMappingURL=admin.js.map