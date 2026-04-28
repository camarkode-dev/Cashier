"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
const env_1 = require("./env");
async function createClient() {
    const cookieStore = await (0, headers_1.cookies)();
    return (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, (0, env_1.getSupabasePublicKey)(), {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                }
                catch {
                    // Server component — cookies can be read but not set
                }
            },
        },
    });
}
//# sourceMappingURL=server.js.map