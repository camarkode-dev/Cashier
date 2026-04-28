'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Keyboard, ScanLine, ShieldAlert, X } from 'lucide-react';
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
  const [cameraPermission, setCameraPermission] = useState<'unknown' | 'prompt' | 'granted' | 'denied'>('unknown');
  const [isScanning, setIsScanning] = useState(false);
  const scannerId = 'html5qr-scanner';

  const stopCamera = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {}

    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      scannerRef.current = new Html5Qrcode(scannerId);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText: string) => {
          stopCamera();
          onScan(decodedText);
        },
      );
      setIsScanning(true);
      setCameraPermission('granted');
    } catch {
      setCameraPermission('denied');
      setCameraError('تعذر الوصول إلى الكاميرا. اسمح للتطبيق باستخدام الكاميرا ثم حاول مرة أخرى.');
      setCameraMode(false);
    }
  }, [onScan, stopCamera]);

  const requestCameraPermission = useCallback(async () => {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('هذا المتصفح لا يدعم الوصول إلى الكاميرا.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission('granted');
      setCameraMode(true);
    } catch {
      setCameraPermission('denied');
      setCameraError('تم رفض إذن الكاميرا. فعّل إذن الكاميرا من المتصفح ثم أعد المحاولة.');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      try {
        if (!navigator.permissions?.query) {
          if (mounted) setCameraPermission('prompt');
          return;
        }

        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (!mounted) return;

        setCameraPermission(
          permission.state === 'granted'
            ? 'granted'
            : permission.state === 'denied'
              ? 'denied'
              : 'prompt',
        );
      } catch {
        if (mounted) setCameraPermission('prompt');
      }
    };

    checkPermission();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (cameraMode) {
      startCamera();
    } else {
      stopCamera();
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      stopCamera();
    };
  }, [cameraMode, startCamera, stopCamera]);

  useEffect(() => {
    let buffer = '';
    let timer: ReturnType<typeof setTimeout>;

    const onKey = (event: KeyboardEvent) => {
      if (event.target === inputRef.current) return;

      if (event.key === 'Enter' && buffer.length >= 3) {
        onScan(buffer.trim());
        buffer = '';
        clearTimeout(timer);
        return;
      }

      if (event.key.length === 1) {
        buffer += event.key;
        clearTimeout(timer);
        timer = setTimeout(() => {
          buffer = '';
        }, 150);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [onScan]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white shadow-2xl animate-scale-in dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ScanLine size={20} className="text-brand-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">مسح الباركود</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {cameraMode && (
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
              <div id={scannerId} className="h-full w-full" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-28 w-48 rounded-xl border-2 border-brand-400">
                  <div className="absolute start-0 top-0 h-5 w-5 rounded-tl-lg border-s-2 border-t-2 border-brand-400" />
                  <div className="absolute end-0 top-0 h-5 w-5 rounded-tr-lg border-e-2 border-t-2 border-brand-400" />
                  <div className="absolute bottom-0 start-0 h-5 w-5 rounded-bl-lg border-b-2 border-s-2 border-brand-400" />
                  <div className="absolute bottom-0 end-0 h-5 w-5 rounded-br-lg border-b-2 border-e-2 border-brand-400" />
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-brand-400/70 animate-pulse" />
                </div>
              </div>
              {isScanning && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                  <span className="rounded-full bg-brand-500/80 px-3 py-1 text-xs text-white">جاري المسح...</span>
                </div>
              )}
            </div>
          )}

          {!cameraMode && cameraPermission !== 'granted' && (
            <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300">
              <div className="flex items-start gap-2">
                <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">يلزم السماح باستخدام الكاميرا</p>
                  <p className="mt-1 text-xs leading-5">
                    عند الضغط على الزر التالي سيطلب المتصفح إذن الكاميرا حتى تعمل خاصية المسح.
                  </p>
                </div>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {cameraError}
            </div>
          )}

          <div>
            <p className="mb-2 text-center text-xs text-gray-400">
              {cameraMode ? 'أو أدخل الباركود يدويًا' : 'امسح بالكاميرا أو أدخل الباركود يدويًا'}
            </p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="input flex-1 text-center text-lg font-mono tracking-widest"
                placeholder="الباركود..."
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && manualCode.trim()) {
                    onScan(manualCode.trim());
                    setManualCode('');
                  }
                }}
                dir="ltr"
                autoComplete="off"
              />
              <button
                onClick={() => {
                  if (!manualCode.trim()) return;
                  onScan(manualCode.trim());
                  setManualCode('');
                }}
                disabled={!manualCode.trim()}
                className="btn-brand px-4 py-2.5 text-sm disabled:opacity-40"
              >
                بحث
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (cameraMode) {
                setCameraMode(false);
                return;
              }

              if (cameraPermission === 'granted') {
                setCameraMode(true);
                return;
              }

              requestCameraPermission();
            }}
            className={cn(
              'w-full rounded-xl border py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2',
              cameraMode
                ? 'border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
            )}
          >
            <Camera size={16} />
            {cameraMode
              ? 'إيقاف الكاميرا'
              : cameraPermission === 'granted'
                ? 'تشغيل كاميرا القراءة'
                : 'طلب إذن الكاميرا'}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Keyboard size={12} />
            ماسح USB يعمل تلقائيًا بدون إعداد إضافي
          </div>
        </div>
      </div>
    </div>
  );
}
