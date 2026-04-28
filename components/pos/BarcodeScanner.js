'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarcodeScanner = BarcodeScanner;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
function BarcodeScanner({ onScan, onClose }) {
    const inputRef = (0, react_1.useRef)(null);
    const scannerRef = (0, react_1.useRef)(null);
    const [manualCode, setManualCode] = (0, react_1.useState)('');
    const [cameraMode, setCameraMode] = (0, react_1.useState)(false);
    const [cameraError, setCameraError] = (0, react_1.useState)(null);
    const [isScanning, setIsScanning] = (0, react_1.useState)(false);
    const SCANNER_ID = 'html5qr-scanner';
    const stopCamera = (0, react_1.useCallback)(async () => {
        try {
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            }
        }
        catch { }
        setIsScanning(false);
    }, []);
    const startCamera = (0, react_1.useCallback)(async () => {
        setCameraError(null);
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            scannerRef.current = new Html5Qrcode(SCANNER_ID);
            await scannerRef.current.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 150 } }, (decodedText) => {
                stopCamera();
                onScan(decodedText);
            }, undefined);
            setIsScanning(true);
        }
        catch (err) {
            setCameraError('لا يمكن الوصول للكاميرا. تحقق من الأذونات.');
            setCameraMode(false);
        }
    }, [onScan, stopCamera]);
    (0, react_1.useEffect)(() => {
        if (cameraMode) {
            startCamera();
        }
        else {
            stopCamera();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        return () => { stopCamera(); };
    }, [cameraMode]);
    // Hardware USB scanner: rapid keystrokes ending in Enter
    (0, react_1.useEffect)(() => {
        let buffer = '';
        let timer;
        const onKey = (e) => {
            if (e.target === inputRef.current)
                return;
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
    (0, react_1.useEffect)(() => {
        const h = (e) => { if (e.key === 'Escape')
            onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800 animate-scale-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ScanLine, { size: 20, className: "text-brand-500" }), (0, jsx_runtime_1.jsx)("h2", { className: "font-bold text-gray-900 dark:text-white", children: "\u0645\u0633\u062D \u0627\u0644\u0628\u0627\u0631\u0643\u0648\u062F" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20 }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-5 space-y-4", children: [cameraMode && ((0, jsx_runtime_1.jsxs)("div", { className: "relative rounded-2xl overflow-hidden bg-black aspect-video", children: [(0, jsx_runtime_1.jsx)("div", { id: SCANNER_ID, className: "w-full h-full" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-48 h-28 border-2 border-brand-400 rounded-xl relative", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 start-0 w-5 h-5 border-t-2 border-s-2 border-brand-400 rounded-tl-lg" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 end-0 w-5 h-5 border-t-2 border-e-2 border-brand-400 rounded-tr-lg" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 start-0 w-5 h-5 border-b-2 border-s-2 border-brand-400 rounded-bl-lg" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 end-0 w-5 h-5 border-b-2 border-e-2 border-brand-400 rounded-br-lg" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-1/2 left-0 right-0 h-0.5 bg-brand-400/70 animate-pulse" })] }) }), isScanning && ((0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-2 left-0 right-0 flex justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "px-3 py-1 bg-brand-500/80 text-white text-xs rounded-full", children: "\u062C\u0627\u0631\u064A \u0627\u0644\u0645\u0633\u062D..." }) }))] })), cameraError && ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-3 text-amber-600 text-sm bg-amber-50 dark:bg-amber-950 rounded-2xl px-4", children: cameraError })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400 mb-2 text-center", children: cameraMode ? 'أو أدخل الباركود يدوياً' : 'امسح بالباركود أو أدخله يدوياً' }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("input", { ref: inputRef, type: "text", className: "input flex-1 text-center text-lg font-mono tracking-widest", placeholder: "\u0627\u0644\u0628\u0627\u0631\u0643\u0648\u062F...", value: manualCode, onChange: (e) => setManualCode(e.target.value), onKeyDown: (e) => {
                                                if (e.key === 'Enter' && manualCode.trim()) {
                                                    onScan(manualCode.trim());
                                                    setManualCode('');
                                                }
                                            }, dir: "ltr", autoComplete: "off" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => { if (manualCode.trim()) {
                                                onScan(manualCode.trim());
                                                setManualCode('');
                                            } }, disabled: !manualCode.trim(), className: "btn-brand px-4 py-2.5 text-sm disabled:opacity-40", children: "\u0628\u062D\u062B" })] })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => { setCameraMode((v) => !v); setCameraError(null); }, className: (0, utils_1.cn)('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors', cameraMode
                                ? 'border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Camera, { size: 16 }), cameraMode ? 'إيقاف الكاميرا' : 'تفعيل كاميرا القراءة'] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-xs text-gray-400 justify-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Keyboard, { size: 12 }), "\u0645\u0627\u0633\u062D USB \u0633\u064A\u062A\u0645 \u0627\u0644\u0643\u0634\u0641 \u0639\u0646\u0647 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B"] })] })] }) }));
}
//# sourceMappingURL=BarcodeScanner.js.map