export const dynamic = 'force-dynamic';
import { getAuthUser, handleError, ok, serviceUnavailable, unauthorized } from '@/lib/api-utils';

export async function GET() {
  try {
    const { dbUser, error } = await getAuthUser();

    if (error === 'DB_UNAVAILABLE') {
      return serviceUnavailable('Database connection is unavailable');
    }

    if (!dbUser) return unauthorized();
    return ok(dbUser);
  } catch (error) {
    return handleError(error, 'GET /api/auth/me');
  }
}
