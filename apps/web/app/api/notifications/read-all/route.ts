export const dynamic = 'force-dynamic';
import { getAuthUser, ok, unauthorized } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function PATCH() {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  await prisma.notification.updateMany({
    where: { OR: [{ userId: dbUser.id }, { userId: null }], isRead: false },
    data: { isRead: true },
  });
  return ok({ message: 'All marked as read' });
}
