interface LogContext {
    userId?: string;
    path?: string;
    entity?: string;
    entityId?: string;
    [key: string]: unknown;
}
export declare const logger: {
    info: (message: string, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    error: (message: string, error?: unknown, context?: LogContext) => void;
};
export declare function logApiError(error: unknown, context: LogContext & {
    path: string;
}): Promise<void>;
export {};
//# sourceMappingURL=logger.d.ts.map