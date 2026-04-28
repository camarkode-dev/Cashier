import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';
import { prisma } from './prisma';
import { createClient } from './supabase/server';

export type UserRole = 'OWNER' | 'ADMIN' | 'CASHIER';

type AuthLookupResult = {
  user: any | null;
  dbUser: any | null;
  error?: 'DB_UNAVAILABLE';
};

const ROLE_LEVEL: Record<UserRole, number> = { OWNER: 3, ADMIN: 2, CASHIER: 1 };

export function isDatabaseUnavailableError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return (
    error.name === 'PrismaClientInitializationError' ||
    error.message.includes("Can't reach database server") ||
    error.message.includes('Error querying the database') ||
    error.message.includes('Connection refused')
  );
}

export async function getAuthUser(minRole?: UserRole): Promise<AuthLookupResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: null, dbUser: null };

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        branch: true,
        tenant: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true,
            phone: true,
            currency: true,
            taxRate: true,
            logo: true,
          },
        },
      },
    });

    if (!dbUser || !dbUser.isActive) return { user: null, dbUser: null };

    if (minRole && ROLE_LEVEL[dbUser.role as UserRole] < ROLE_LEVEL[minRole]) {
      return { user: null, dbUser: null };
    }

    return { user, dbUser };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      logger.warn('[getAuthUser] database unavailable');
      return { user, dbUser: null, error: 'DB_UNAVAILABLE' };
    }

    throw error;
  }
}

export async function audit(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: object,
) {
  await prisma.auditLog.create({
    data: { userId, action, entity, entityId, metadata: metadata ?? undefined },
  });
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function err(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function unauthorized(message = 'Unauthorized') {
  return err(message, 401);
}

export function forbidden(message = 'Insufficient permissions') {
  return err(message, 403);
}

export function notFound(entity = 'Resource') {
  return err(`${entity} not found`, 404);
}

export function serviceUnavailable(message = 'Service unavailable') {
  return err(message, 503);
}

export function serverError(error?: unknown) {
  const message = error instanceof Error ? error.message : 'Internal server error';
  logger.error('[serverError]', error);
  return err(message, 500);
}

export function handleError(error: unknown, context?: string) {
  if (error instanceof ZodError) {
    return err('Validation error', 422, error.flatten().fieldErrors);
  }

  if (isDatabaseUnavailableError(error)) {
    logger.error(`[handleError][db-unavailable]${context ? ` ${context}` : ''}`, error);
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

  logger.error(`[handleError]${context ? ` ${context}` : ''}`, error);
  return serverError(error);
}

export function requireRole(dbUser: { role: string } | null, minRole: UserRole): boolean {
  if (!dbUser) return false;
  return ROLE_LEVEL[dbUser.role as UserRole] >= ROLE_LEVEL[minRole];
}

export async function generateInvoiceNumber(branchId?: string) {
  const date = new Date();
  const dateKey = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const count = await prisma.sale.count({
    where: {
      createdAt: { gte: new Date(date.setHours(0, 0, 0, 0)) },
    },
  });

  return `INV-${dateKey}-${String(count + 1).padStart(4, '0')}`;
}
