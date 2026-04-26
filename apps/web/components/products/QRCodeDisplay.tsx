'use client';
import { useState, useEffect } from 'react';
import { Download, Printer, QrCode } from 'lucide-react';
import { productsApi } from '@/lib/api';

interface QRCodeDisplayProps {
  productId: string;
  productName: string;
  barcode?: string;
  size?: number;
}

export function QRCodeDisplay({ productId, productName, barcode, size = 200 }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    productsApi.qr(productId, 'dataurl')
      .then((res: any) => {
        if (!cancelled) setDataUrl(res?.dataUrl || null);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [productId]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-${barcode || productId}.png`;
    a.click();
  };

  const handlePrint = () => {
    if (!dataUrl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR - ${productName}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; margin:0; }
        img { width:${size}px; height:${size}px; }
        p { margin:8px 0 4px; font-size:14px; font-weight:bold; }
        small { color:#666; font-size:12px; }
      </style></head>
      <body>
        <img src="${dataUrl}" />
        <p>${productName}</p>
        ${barcode ? `<small>${barcode}</small>` : ''}
        <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>
    `);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !dataUrl) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-300" style={{ width: size, height: size }}>
        <QrCode size={32} className="mb-2" />
        <span className="text-xs">تعذّر تحميل QR</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <img src={dataUrl} alt={`QR Code for ${productName}`} width={size} height={size} className="rounded-xl" />
      <div className="flex gap-2">
        <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <Download size={14} />
          تنزيل
        </button>
        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 text-sm font-medium hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors">
          <Printer size={14} />
          طباعة
        </button>
      </div>
    </div>
  );
}
