import { NextResponse } from 'next/server';
import { createClient } from './supabase/server';
import { prisma } from './prisma';
import { ZodError } from 'zod';
import { logger } from './logger';

export type UserRole = 'OWNER' | 'ADMIN' | 'CASHIER';

const ROLE_LEVEL: Record<UserRole, number> = { OWNER: 3, ADMIN: 2, CASHIER: 1 };

// ─── Auth helper ────────────────────────────────────────────────────────────

export async function getAuthUser(minRole?: UserRole) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: null, dbUser: null };

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

  if (!dbUser || !dbUser.isActive) return { user: null, dbUser: null };

  if (minRole && ROLE_LEVEL[dbUser.role as UserRole] < ROLE_LEVEL[minRole]) {
    return { user: null, dbUser: null };
  }

  return { user, dbUser };
}

// ─── Audit log helper ────────────────────────────────────────────────────────

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

// ─── Response helpers ────────────────────────────────────────────────────────

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

export function serverError(e?: unknown) {
  const msg = e instanceof Error ? e.message : 'Internal server error';
  logger.error('[serverError]', e);
  return err(msg, 500);
}

// ─── Zod error handler ───────────────────────────────────────────────────────

export function handleError(e: unknown, context?: string) {
  if (e instanceof ZodError) {
    return err('Validation error', 422, e.flatten().fieldErrors);
  }
  if (e instanceof Error) {
    if (e.message.includes('Unique constraint') || e.message.includes('unique constraint')) {
      return err('Record already exists', 409);
    }
    if (e.message.includes('Record to update not found')) {
      return err('Not found', 404);
    }
    // Business logic errors (stock, branch, etc.) → 400
    if (e.message.match(/[أ-ي]/) || e.message.toLowerCase().includes('insufficient')) {
      return err(e.message, 400);
    }
  }
  logger.error(`[handleError]${context ? ` ${context}` : ''}`, e);
  return serverError(e);
}

// ─── Role check ──────────────────────────────────────────────────────────────

export function requireRole(dbUser: { role: string } | null, minRole: UserRole): boolean {
  if (!dbUser) return false;
  return ROLE_LEVEL[dbUser.role as UserRole] >= ROLE_LEVEL[minRole];
}

// ─── Invoice number generator ────────────────────────────────────────────────

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
