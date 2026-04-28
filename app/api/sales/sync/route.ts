export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, getAuthUser, unauthorized, handleError } from '@/lib/api-utils';
import { offlineSyncSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  try {
    const { sales } = offlineSyncSchema.parse(await req.json());
    const results: Array<{ offlineId: string; status: string; saleId?: string }> = [];

    for (const salePaylod of sales) {
      const { offlineId, ...saleData } = salePaylod;

      // Import and reuse the sale creation logic
      const createResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sales`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: '' },
          body: JSON.stringify({ ...saleData, offlineId }),
        },
      );

      const result = await createResponse.json();

      if (result.data?.duplicate) {
        results.push({ offlineId: offlineId!, status: 'already_synced', saleId: result.data.id });
      } else if (result.success) {
        results.push({ offlineId: offlineId!, status: 'synced', saleId: result.data.id });
      } else {
        results.push({ offlineId: offlineId!, status: 'error' });
      }
    }

    return ok({ results, synced: results.filter((r) => r.status === 'synced').length });
  } catch (e) {
    return handleError(e);
  }
}
