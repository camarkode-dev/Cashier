export declare const dynamic = "force-dynamic";
import { NextRequest } from 'next/server';
type Params = {
    params: {
        id: string;
    };
};
export declare function GET(_req: NextRequest, { params }: Params): Promise<any>;
export declare function PATCH(req: NextRequest, { params }: Params): Promise<any>;
export {};
//# sourceMappingURL=route.d.ts.map