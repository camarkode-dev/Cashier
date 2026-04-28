"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logo = Logo;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@/lib/utils");
const BrandMark_1 = require("@/components/common/BrandMark");
const sizes = {
    xs: { icon: 28, fontSize: 11 },
    sm: { icon: 36, fontSize: 13 },
    md: { icon: 48, fontSize: 15 },
    lg: { icon: 64, fontSize: 20 },
    xl: { icon: 96, fontSize: 28 },
};
const BRAND_NAME = 'أولاد أيمن';
const BRAND_SUBTITLE = 'للأدوات المنزلية';
function Logo({ size = 'md', variant = 'full', className }) {
    const s = sizes[size];
    const icon = (0, jsx_runtime_1.jsx)(BrandMark_1.BrandMark, { size: s.icon, title: BRAND_NAME });
    if (variant === 'icon') {
        return (0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)('flex items-center', className), children: icon });
    }
    if (variant === 'horizontal') {
        return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)('flex items-center gap-3', className), children: [icon, (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col leading-tight", children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: s.fontSize + 2 }, className: "font-black text-gray-900 dark:text-white whitespace-nowrap", children: BRAND_NAME }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: s.fontSize - 2 }, className: "font-medium text-brand-500 whitespace-nowrap", children: BRAND_SUBTITLE })] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)('flex flex-col items-center gap-2', className), children: [icon, (0, jsx_runtime_1.jsxs)("div", { className: "text-center leading-tight", children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: s.fontSize + 2 }, className: "font-black text-gray-900 dark:text-white", children: BRAND_NAME }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: s.fontSize - 1 }, className: "font-semibold text-brand-500", children: BRAND_SUBTITLE })] })] }));
}
//# sourceMappingURL=Logo.js.map