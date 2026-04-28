'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodeDisplay = QRCodeDisplay;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
function QRCodeDisplay({ productId, productName, barcode, size = 200 }) {
    const [dataUrl, setDataUrl] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        api_1.productsApi.qr(productId, 'dataurl')
            .then((res) => {
            if (!cancelled)
                setDataUrl(res?.dataUrl || null);
        })
            .catch(() => { if (!cancelled)
            setError(true); })
            .finally(() => { if (!cancelled)
            setLoading(false); });
        return () => { cancelled = true; };
    }, [productId]);
    const handleDownload = () => {
        if (!dataUrl)
            return;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `qr-${barcode || productId}.png`;
        a.click();
    };
    const handlePrint = () => {
        if (!dataUrl)
            return;
        const win = window.open('', '_blank');
        if (!win)
            return;
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
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center", style: { width: size, height: size }, children: (0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" }) }));
    }
    if (error || !dataUrl) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center text-gray-300", style: { width: size, height: size }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.QrCode, { size: 32, className: "mb-2" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs", children: "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 QR" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center gap-3", children: [(0, jsx_runtime_1.jsx)("img", { src: dataUrl, alt: `QR Code for ${productName}`, width: size, height: size, className: "rounded-xl" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: handleDownload, className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 14 }), "\u062A\u0646\u0632\u064A\u0644"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handlePrint, className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 text-sm font-medium hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { size: 14 }), "\u0637\u0628\u0627\u0639\u0629"] })] })] }));
}
//# sourceMappingURL=QRCodeDisplay.js.map