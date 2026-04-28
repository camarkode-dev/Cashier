export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized, forbidden } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser('OWNER');
  if (!dbUser) return unauthorized();
  if (dbUser.role !== 'OWNER') return forbidden();

  const { searchParams } = req.nextUrl;
  const entity = searchParams.get('entity') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  const where: any = {};
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return ok({ data, meta: { total, page, limit } });
}
