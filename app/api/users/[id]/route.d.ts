export declare const dynamic = "force-dynamic";
import { NextRequest } from 'next/server';
type P = {
    params: {
        id: string;
    };
};
export declare function GET(_: NextRequest, { params }: P): Promise<any>;
export declare function PATCH(req: NextRequest, { params }: P): Promise<any>;
export declare function DELETE(_: NextRequest, { params }: P): Promise<any>;
export {};
//# sourceMappingURL=route.d.ts.map