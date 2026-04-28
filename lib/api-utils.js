"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDatabaseUnavailableError = isDatabaseUnavailableError;
exports.getAuthUser = getAuthUser;
exports.audit = audit;
exports.ok = ok;
exports.created = created;
exports.noContent = noContent;
exports.err = err;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.serviceUnavailable = serviceUnavailable;
exports.serverError = serverError;
exports.handleError = handleError;
exports.requireRole = requireRole;
exports.generateInvoiceNumber = generateInvoiceNumber;
const server_1 = require("next/server");
const zod_1 = require("zod");
const logger_1 = require("./logger");
const prisma_1 = require("./prisma");
const server_2 = require("./supabase/server");
const ROLE_LEVEL = { OWNER: 3, ADMIN: 2, CASHIER: 1 };
function isDatabaseUnavailableError(error) {
    if (!(error instanceof Error))
        return false;
    return (error.name === 'PrismaClientInitializationError' ||
        error.message.includes("Can't reach database server") ||
        error.message.includes('Error querying the database') ||
        error.message.includes('Connection refused'));
}
async function getAuthUser(minRole) {
    const supabase = await (0, server_2.createClient)();
    const { data: { user }, error, } = await supabase.auth.getUser();
    if (error || !user)
        return { user: null, dbUser: null };
    try {
        const dbUser = await prisma_1.prisma.user.findUnique({
            where: { id: user.id },
            include: {
                branch: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        slug: true,
                        currency: true,
                        taxRate: true,
                        logo: true,
                        license: {
                            select: {
                                type: true,
                                status: true,
                                expiresAt: true,
                                maxDevices: true,
                                maxUsers: true,
                            },
                        },
                    },
                },
            },
        });
        if (!dbUser || !dbUser.isActive)
            return { user: null, dbUser: null };
        if (minRole && ROLE_LEVEL[dbUser.role] < ROLE_LEVEL[minRole]) {
            return { user: null, dbUser: null };
        }
        return { user, dbUser };
    }
    catch (error) {
        if (isDatabaseUnavailableError(error)) {
            logger_1.logger.warn('[getAuthUser] database unavailable');
            return { user, dbUser: null, error: 'DB_UNAVAILABLE' };
        }
        throw error;
    }
}
async function audit(userId, action, entity, entityId, metadata) {
    await prisma_1.prisma.auditLog.create({
        data: { userId, action, entity, entityId, metadata: metadata ?? undefined },
    });
}
function ok(data, status = 200) {
    return server_1.NextResponse.json({ success: true, data }, { status });
}
function created(data) {
    return ok(data, 201);
}
function noContent() {
    return new server_1.NextResponse(null, { status: 204 });
}
function err(message, status = 400, details) {
    return server_1.NextResponse.json({ success: false, error: message, details }, { status });
}
function unauthorized(message = 'Unauthorized') {
    return err(message, 401);
}
function forbidden(message = 'Insufficient permissions') {
    return err(message, 403);
}
function notFound(entity = 'Resource') {
    return err(`${entity} not found`, 404);
}
function serviceUnavailable(message = 'Service unavailable') {
    return err(message, 503);
}
function serverError(error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger_1.logger.error('[serverError]', error);
    return err(message, 500);
}
function handleError(error, context) {
    if (error instanceof zod_1.ZodError) {
        return err('Validation error', 422, error.flatten().fieldErrors);
    }
    if (isDatabaseUnavailableError(error)) {
        logger_1.logger.error(`[handleError][db-unavailable]${context ? ` ${context}` : ''}`, error);
        return serviceUnavailable('Database connection is unavailable');
    }
    if (error instanceof Error) {
        if (error.message.includes('Unique constraint') || error.message.includes('unique constraint')) {
            return err('Record already exists', 409);
        }
        if (error.message.includes('Record to update not found')) {
            return err('Not found', 404);
        }
        if (error.message.match(/[أ-ي]/) || error.message.toLowerCase().includes('insufficient')) {
            return err(error.message, 400);
        }
    }
    logger_1.logger.error(`[handleError]${context ? ` ${context}` : ''}`, error);
    return serverError(error);
}
function requireRole(dbUser, minRole) {
    if (!dbUser)
        return false;
    return ROLE_LEVEL[dbUser.role] >= ROLE_LEVEL[minRole];
}
async function generateInvoiceNumber(branchId) {
    const date = new Date();
    const dateKey = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await prisma_1.prisma.sale.count({
        where: {
            createdAt: { gte: new Date(date.setHours(0, 0, 0, 0)) },
        },
    });
    return `INV-${dateKey}-${String(count + 1).padStart(4, '0')}`;
}
//# sourceMappingURL=api-utils.js.map