export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, serverError } from '@/lib/api-utils';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return ok({ message: 'Logged out' });
  } catch (e) {
    return serverError(e);
  }
}
