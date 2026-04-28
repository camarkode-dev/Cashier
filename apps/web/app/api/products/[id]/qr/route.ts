export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, notFound, serverError } from '@/lib/api-utils';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true, barcode: true, name: true, nameAr: true },
  });

  if (!product) return notFound('Product');

  const format = req.nextUrl.searchParams.get('format') || 'svg'; // svg | png | dataurl
  const payload = product.barcode || product.id;

  try {
    if (format === 'png') {
      const buffer = await QRCode.toBuffer(payload, {
        errorCorrectionLevel: 'M',
        width: 300,
        margin: 2,
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="${product.id}.png"`,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    if (format === 'dataurl') {
      const dataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', width: 300 });
      return NextResponse.json({ success: true, data: { dataUrl, payload } });
    }

    // SVG (default)
    const svg = await QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: 'M' });
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
