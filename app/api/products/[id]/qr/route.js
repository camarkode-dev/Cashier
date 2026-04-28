"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = require("@/lib/prisma");
const api_utils_1 = require("@/lib/api-utils");
async function GET(req, { params }) {
    const { dbUser } = await (0, api_utils_1.getAuthUser)();
    if (!dbUser)
        return (0, api_utils_1.unauthorized)();
    const product = await prisma_1.prisma.product.findUnique({
        where: { id: params.id },
        select: { id: true, barcode: true, name: true, nameAr: true },
    });
    if (!product)
        return (0, api_utils_1.notFound)('Product');
    const format = req.nextUrl.searchParams.get('format') || 'svg'; // svg | png | dataurl
    const payload = product.barcode || product.id;
    try {
        if (format === 'png') {
            const buffer = await qrcode_1.default.toBuffer(payload, {
                errorCorrectionLevel: 'M',
                width: 300,
                margin: 2,
            });
            return new server_1.NextResponse(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Disposition': `inline; filename="${product.id}.png"`,
                    'Cache-Control': 'public, max-age=86400',
                },
            });
        }
        if (format === 'dataurl') {
            const dataUrl = await qrcode_1.default.toDataURL(payload, { errorCorrectionLevel: 'M', width: 300 });
            return server_1.NextResponse.json({ success: true, data: { dataUrl, payload } });
        }
        // SVG (default)
        const svg = await qrcode_1.default.toString(payload, { type: 'svg', errorCorrectionLevel: 'M' });
        return new server_1.NextResponse(svg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=86400',
            },
        });
    }
    catch (e) {
        return (0, api_utils_1.serverError)(e);
    }
}
//# sourceMappingURL=route.js.map