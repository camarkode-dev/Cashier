'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ScanLine, Camera, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<any>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const SCANNER_ID = 'html5qr-scanner';

  const stopCamera = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch {}
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      scannerRef.current = new Html5Qrcode(SCANNER_ID);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText: string) => {
          stopCamera();
          onScan(decodedText);
        },
        undefined,
      );
      setIsScanning(true);
    } catch (err: any) {
      setCameraError('لا يمكن الوصول للكاميرا. تحقق من الأذونات.');
      setCameraMode(false);
    }
  }, [onScan, stopCamera]);

  useEffect(() => {
    if (cameraMode) {
      startCamera();
    } else {
      stopCamera();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => { stopCamera(); };
  }, [cameraMode]);

  // Hardware USB scanner: rapid keystrokes ending in Enter
  useEffect(() => {
    let buffer = '';
    let timer: ReturnType<typeof setTimeout>;

    const onKey = (e: KeyboardEvent) => {
      if (e.target === inputRef.current) return;
      if (e.key === 'Enter' && buffer.length >= 3) {
        onScan(buffer.trim());
        buffer = '';
        clearTimeout(timer);
        return;
      }
      if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buffer = ''; }, 150);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer); };
  }, [onScan]);

  // ESC to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ScanLine size={20} className="text-brand-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">مسح الباركود</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Camera container */}
          {cameraMode && (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
              <div id={SCANNER_ID} className="w-full h-full" />
              {/* Scan guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-28 border-2 border-brand-400 rounded-xl relative">
                  <div className="absolute top-0 start-0 w-5 h-5 border-t-2 border-s-2 border-brand-400 rounded-tl-lg" />
                  <div className="absolute top-0 end-0 w-5 h-5 border-t-2 border-e-2 border-brand-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 start-0 w-5 h-5 border-b-2 border-s-2 border-brand-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 end-0 w-5 h-5 border-b-2 border-e-2 border-brand-400 rounded-br-lg" />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-brand-400/70 animate-pulse" />
                </div>
              </div>
              {isScanning && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                  <span className="px-3 py-1 bg-brand-500/80 text-white text-xs rounded-full">جاري المسح...</span>
                </div>
              )}
            </div>
          )}

          {cameraError && (
            <div className="text-center py-3 text-amber-600 text-sm bg-amber-50 dark:bg-amber-950 rounded-2xl px-4">
              {cameraError}
            </div>
          )}

          {/* Manual input */}
          <div>
            <p className="text-xs text-gray-400 mb-2 text-center">
              {cameraMode ? 'أو أدخل الباركود يدوياً' : 'امسح بالباركود أو أدخله يدوياً'}
            </p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="input flex-1 text-center text-lg font-mono tracking-widest"
                placeholder="الباركود..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualCode.trim()) {
                    onScan(manualCode.trim());
                    setManualCode('');
                  }
                }}
                dir="ltr"
                autoComplete="off"
              />
              <button
                onClick={() => { if (manualCode.trim()) { onScan(manualCode.trim()); setManualCode(''); } }}
                disabled={!manualCode.trim()}
                className="btn-brand px-4 py-2.5 text-sm disabled:opacity-40"
              >
                بحث
              </button>
            </div>
          </div>

          {/* Camera toggle */}
          <button
            onClick={() => { setCameraMode((v) => !v); setCameraError(null); }}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              cameraMode
                ? 'border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
            )}
          >
            <Camera size={16} />
            {cameraMode ? 'إيقاف الكاميرا' : 'تفعيل كاميرا القراءة'}
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
            <Keyboard size={12} />
            ماسح USB سيتم الكشف عنه تلقائياً
          </div>
        </div>
      </div>
    </div>
  );
}
