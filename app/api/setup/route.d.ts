export declare const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    error: any;
}> | NextResponse<{
    success: boolean;
    data: {
        emailConfirmationRequired: boolean;
        message: string;
    };
}>>;
//# sourceMappingURL=route.d.ts.map