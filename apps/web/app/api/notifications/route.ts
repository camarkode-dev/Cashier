export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);
  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';

  const where: any = { OR: [{ userId: dbUser.id }, { userId: null }] };
  if (unreadOnly) where.isRead = false;

  const [data, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
  ]);

  return ok({ data, unreadCount });
}

export async function DELETE() {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  await prisma.notification.deleteMany({ where: { OR: [{ userId: dbUser.id }, { userId: null }] } });
  return ok({ message: 'Cleared' });
}
