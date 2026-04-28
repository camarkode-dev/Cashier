"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const api_utils_1 = require("@/lib/api-utils");
const validations_1 = require("@/lib/validations");
async function POST(req) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    try {
        const { sales } = validations_1.offlineSyncSchema.parse(await req.json());
        const results = [];
        for (const salePaylod of sales) {
            const { offlineId, ...saleData } = salePaylod;
            // Import and reuse the sale creation logic
            const createResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Cookie: '' },
                body: JSON.stringify({ ...saleData, offlineId }),
            });
            const result = await createResponse.json();
            if (result.data?.duplicate) {
                results.push({ offlineId: offlineId, status: 'already_synced', saleId: result.data.id });
            }
            else if (result.success) {
                results.push({ offlineId: offlineId, status: 'synced', saleId: result.data.id });
            }
            else {
                results.push({ offlineId: offlineId, status: 'error' });
            }
        }
        return (0, api_utils_1.ok)({ results, synced: results.filter((r) => r.status === 'synced').length });
    }
    catch (e) {
        return (0, api_utils_1.handleError)(e);
    }
}
//# sourceMappingURL=route.js.map