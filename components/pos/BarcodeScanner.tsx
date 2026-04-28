'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Camera, CameraOff, Keyboard, ScanLine, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  autoStart?: boolean;
  variant?: 'modal' | 'inline';
}

export function BarcodeScanner({
  onScan,
  onClose,
  autoStart = false,
  variant = 'modal',
}: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const mountedRef = useRef(true);

  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const stopCamera = useCallback(() => {
    try { controlsRef.current?.stop(); } catch {}
    controlsRef.current = null;
    setIsScanning(false);
  }, []);

  const triggerScan = useCallback((code: string) => {
    stopCamera();
    setScanSuccess(true);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setScanSuccess(false);
      setCameraActive(false);
      onScan(code);
    }, 350);
  }, [onScan, stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!videoRef.current) return;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { DecodeHintType, BarcodeFormat } = await import('@zxing/library');
      if (!mountedRef.current) return;

      const hints = new Map<any, any>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.CODE_93,
        BarcodeFormat.CODABAR, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 80 });
      if (!mountedRef.current) return;
      setIsScanning(true);

      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current,
        (result, _err, ctrl) => {
          if (result && mountedRef.current) {
            ctrl.stop();
            controlsRef.current = null;
            triggerScan(result.getText());
          }
        },
      );
      if (!mountedRef.current) { controls.stop(); return; }
      controlsRef.current = controls;
    } catch {
      if (mountedRef.current) {
        setCameraError('تعذر الوصول إلى الكاميرا — تأكد من منح الإذن.');
        setCameraActive(false);
        setIsScanning(false);
      }
    }
  }, [triggerScan]);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
      setTimeout(() => inputRef.current?.focus(), 120);
    }
    return () => { stopCamera(); };
  }, [cameraActive]); // eslint-disable-line

  // USB/Bluetooth physical scanner
  useEffect(() => {
    let buf = '';
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      if (e.target === inputRef.current) return;
      if (e.key === 'Enter' && buf.length >= 3) { onScan(buf.trim()); buf = ''; clearTimeout(timer); return; }
      if (e.key.length === 1) { buf += e.key; clearTimeout(timer); timer = setTimeout(() => { buf = ''; }, 150); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer); };
  }, [onScan]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => { if (autoStart) setCameraActive(true); }, [autoStart]);

  // ─── Camera viewport shared between modal & inline ───────────────────────
  const CameraView = ({ height = 300 }: { height?: number }) => (
    <div className="relative w-full overflow-hidden bg-black" style={{ height }}>
      {/* Video element always rendered so ref is stable */}
      <video
        ref={videoRef}
        className={cn('absolute inset-0 w-full h-full object-cover transition-opacity duration-300', cameraActive ? 'opacity-100' : 'opacity-0')}
        playsInline muted autoPlay
      />

      {/* Placeholder when camera is off */}
      {!cameraActive && !cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950">
          <div className="w-16 h-16 rounded-3xl bg-gray-800 flex items-center justify-center">
            <Camera size={28} className="text-gray-500" />
          </div>
          <p className="text-gray-500 text-sm">اضغط لتشغيل الكاميرا</p>
        </div>
      )}

      {/* Error state */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-950 px-6 text-center">
          <CameraOff size={32} className="text-red-400" />
          <p className="text-red-300 text-sm">{cameraError}</p>
          <button
            onClick={() => { setCameraError(null); setCameraActive(true); }}
            className="mt-1 px-4 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-semibold"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Scan frame overlay — only when camera is active */}
      {cameraActive && !cameraError && (
        <>
          {/* 4-quadrant dim overlay */}
          <div className="absolute inset-x-0 top-0 bg-black/55 pointer-events-none" style={{ height: 'calc(50% - 52px)' }} />
          <div className="absolute inset-x-0 bottom-0 bg-black/55 pointer-events-none" style={{ height: 'calc(50% - 52px)' }} />
          <div className="absolute top-0 bottom-0 left-0 bg-black/55 pointer-events-none"
            style={{ top: 'calc(50% - 52px)', bottom: 'calc(50% - 52px)', width: 'calc(50% - 116px)' }} />
          <div className="absolute top-0 bottom-0 right-0 bg-black/55 pointer-events-none"
            style={{ top: 'calc(50% - 52px)', bottom: 'calc(50% - 52px)', width: 'calc(50% - 116px)' }} />

          {/* Scan frame */}
          <div
            className={cn(
              'absolute pointer-events-none transition-all duration-300',
              scanSuccess ? 'opacity-0' : 'opacity-100',
            )}
            style={{
              top: 'calc(50% - 52px)',
              left: 'calc(50% - 116px)',
              width: '232px',
              height: '104px',
            }}
          >
            {/* Corner brackets */}
            <span className="absolute top-0 left-0 w-6 h-6 border-l-[3px] border-t-[3px] border-brand-400 rounded-tl-sm" />
            <span className="absolute top-0 right-0 w-6 h-6 border-r-[3px] border-t-[3px] border-brand-400 rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 w-6 h-6 border-l-[3px] border-b-[3px] border-brand-400 rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 w-6 h-6 border-r-[3px] border-b-[3px] border-brand-400 rounded-br-sm" />

            {/* Animated scan line */}
            {isScanning && (
              <div
                className="absolute inset-x-2 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent"
                style={{ animation: 'barcodeScanLine 1.6s ease-in-out infinite' }}
              />
            )}
          </div>

          {/* Success flash */}
          {scanSuccess && (
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={40} className="text-green-400" />
              </div>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <span className={cn(
              'text-[11px] font-medium px-3 py-1 rounded-full transition-colors',
              scanSuccess ? 'bg-green-500/90 text-white' :
              isScanning ? 'bg-black/60 text-white/70' : 'bg-black/60 text-white/50',
            )}>
              {scanSuccess ? '✓ تم القراءة' : isScanning ? 'جارٍ المسح...' : 'تهيئة...'}
            </span>
          </div>
        </>
      )}
    </div>
  );

  // ─── Inline variant ────────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <>
        <style>{`
          @keyframes barcodeScanLine {
            0%   { top: 8px;  opacity: 0; }
            10%  { opacity: 1; }
            90%  { opacity: 1; }
            100% { top: calc(100% - 8px); opacity: 0; }
          }
        `}</style>
        <div className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-950">
          <CameraView height={220} />
          <div className="flex items-center justify-between px-3 py-2 bg-gray-900">
            <button
              onClick={() => setCameraActive(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                cameraActive
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-brand-500 text-white hover:bg-brand-600',
              )}
            >
              <Camera size={13} />
              {cameraActive ? 'إيقاف' : 'تشغيل الكاميرا'}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs">إغلاق</button>
          </div>
        </div>
      </>
    );
  }

  // ─── Modal variant ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes barcodeScanLine {
          0%   { top: 8px;  opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: calc(100% - 8px); opacity: 0; }
        }
        @keyframes scannerIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Overlay */}
      <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-end md:items-center justify-center">

        {/* Sheet/Modal */}
        <div
          className="w-full md:max-w-md flex flex-col bg-gray-950 md:rounded-3xl overflow-hidden shadow-2xl"
          style={{ animation: 'scannerIn 0.22s ease-out both', maxHeight: '92dvh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <ScanLine size={15} className="text-brand-400" />
              </div>
              <span className="text-white font-bold text-sm">مسح الباركود</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Camera ── */}
          <CameraView height={300} />

          {/* ── Controls ── */}
          <div className="px-4 py-4 space-y-3 bg-gray-900">

            {/* Manual input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 rounded-xl px-3 py-2.5 text-white text-center font-mono tracking-wider placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-sm transition-colors"
                  placeholder="أدخل الباركود يدوياً..."
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && manualCode.trim()) {
                      onScan(manualCode.trim());
                      setManualCode('');
                    }
                  }}
                  dir="ltr"
                  autoComplete="off"
                />
              </div>
              <button
                onClick={() => { if (!manualCode.trim()) return; onScan(manualCode.trim()); setManualCode(''); }}
                disabled={!manualCode.trim()}
                className="px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-sm disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              >
                بحث
              </button>
            </div>

            {/* Camera toggle */}
            <button
              onClick={() => setCameraActive(v => !v)}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]',
                cameraActive
                  ? 'bg-white/8 border border-red-500/40 text-red-400 hover:bg-red-500/10'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25',
              )}
            >
              {cameraActive ? <CameraOff size={16} /> : <Camera size={16} />}
              {cameraActive ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
            </button>

            {/* USB hint */}
            <div className="flex items-center justify-center gap-1.5 text-gray-600 text-xs pb-1">
              <Keyboard size={11} />
              <span>ماسح USB / Bluetooth يعمل تلقائياً</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
