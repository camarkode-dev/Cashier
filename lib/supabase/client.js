"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const ssr_1 = require("@supabase/ssr");
const env_1 = require("./env");
function createClient() {
    return (0, ssr_1.createBrowserClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, (0, env_1.getSupabasePublicKey)());
}
//# sourceMappingURL=client.js.map