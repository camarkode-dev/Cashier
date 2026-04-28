import { prisma } from './prisma';

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  path?: string;
  entity?: string;
  entityId?: string;
  [key: string]: unknown;
}

// ─── Structured console output ────────────────────────────────────────────────

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    ...context,
  });
}

// ─── Main logger ─────────────────────────────────────────────────────────────

export const logger = {
  info: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== 'production') {
      process.stdout.write(formatLog('info', message, context) + '\n');
    }
  },

  warn: (message: string, context?: LogContext) => {
    process.stderr.write(formatLog('warn', message, context) + '\n');
  },

  error: (message: string, error?: unknown, context?: LogContext) => {
    const err = error instanceof Error ? error : undefined;
    process.stderr.write(
      formatLog('error', message, {
        ...context,
        errorMessage: err?.message,
        stack: err?.stack?.split('\n').slice(0, 5).join(' | '),
      }) + '\n',
    );
  },
};

// ─── API error logger (persists to DB for OWNER review) ──────────────────────

export async function logApiError(
  error: unknown,
  context: LogContext & { path: string },
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Always write to stderr (captured by Vercel logs)
  logger.error(`[API] ${context.path}`, error, context);

  // Persist critical errors to DB (non-blocking, never throws)
  try {
    await prisma.auditLog.create({
      data: {
        userId: context.userId || 'system',
        action: 'ERROR',
        entity: 'api',
        entityId: context.path,
        metadata: JSON.parse(JSON.stringify({ message, stack: stack?.split('\n').slice(0, 8), context })),
      },
    });
  } catch {
    // Logger must never throw
  }
}
