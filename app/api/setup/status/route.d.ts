export declare const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    success: boolean;
    data: {
        needsSetup: boolean;
        hasTenant: boolean;
        hasUser: boolean;
        currentUserProvisioned: boolean;
    };
}>>;
//# sourceMappingURL=route.d.ts.map