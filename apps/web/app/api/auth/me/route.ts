import { getAuthUser, ok, unauthorized } from '@/lib/api-utils';

export async function GET() {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  return ok(dbUser);
}
