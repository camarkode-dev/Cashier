"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.dynamic = 'force-dynamic';
const api_utils_1 = require("@/lib/api-utils");
async function GET() {
    try {
        const { dbUser, error } = await (0, api_utils_1.getAuthUser)();
        if (error === 'DB_UNAVAILABLE') {
            return (0, api_utils_1.serviceUnavailable)('Database connection is unavailable');
        }
        if (!dbUser)
            return (0, api_utils_1.unauthorized)();
        return (0, api_utils_1.ok)(dbUser);
    }
    catch (error) {
        return (0, api_utils_1.handleError)(error, 'GET /api/auth/me');
    }
}
//# sourceMappingURL=route.js.map