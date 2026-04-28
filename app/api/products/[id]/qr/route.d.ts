export declare const dynamic = "force-dynamic";
import { NextRequest } from 'next/server';
type Params = {
    params: {
        id: string;
    };
};
export declare function GET(req: NextRequest, { params }: Params): Promise<any>;
export {};
//# sourceMappingURL=route.d.ts.map