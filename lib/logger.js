"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logApiError = logApiError;
const prisma_1 = require("./prisma");
// ─── Structured console output ────────────────────────────────────────────────
function formatLog(level, message, context) {
    return JSON.stringify({
        level,
        message,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        ...context,
    });
}
// ─── Main logger ─────────────────────────────────────────────────────────────
exports.logger = {
    info: (message, context) => {
        if (process.env.NODE_ENV !== 'production') {
            process.stdout.write(formatLog('info', message, context) + '\n');
        }
    },
    warn: (message, context) => {
        process.stderr.write(formatLog('warn', message, context) + '\n');
    },
    error: (message, error, context) => {
        const err = error instanceof Error ? error : undefined;
        process.stderr.write(formatLog('error', message, {
            ...context,
            errorMessage: err?.message,
            stack: err?.stack?.split('\n').slice(0, 5).join(' | '),
        }) + '\n');
    },
};
// ─── API error logger (persists to DB for OWNER review) ──────────────────────
async function logApiError(error, context) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    // Always write to stderr (captured by Vercel logs)
    exports.logger.error(`[API] ${context.path}`, error, context);
    // Persist critical errors to DB (non-blocking, never throws)
    try {
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: context.userId || 'system',
                action: 'ERROR',
                entity: 'api',
                entityId: context.path,
                metadata: JSON.parse(JSON.stringify({ message, stack: stack?.split('\n').slice(0, 8), context })),
            },
        });
    }
    catch {
        // Logger must never throw
    }
}
//# sourceMappingURL=logger.js.map