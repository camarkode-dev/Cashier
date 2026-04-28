'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const Sidebar_1 = require("@/components/layout/Sidebar");
const Header_1 = require("@/components/layout/Header");
const auth_store_1 = require("@/stores/auth.store");
const settings_store_1 = require("@/stores/settings.store");
const sync_1 = require("@/lib/sync");
const db_1 = require("@/lib/db");
const client_1 = require("@/lib/supabase/client");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
function DashboardLayout({ children }) {
    const router = (0, navigation_1.useRouter)();
    const { user, initialize, isInitialized, needsSetup } = (0, auth_store_1.useAuthStore)();
    const { setOnline, setPendingSyncCount, activeBranchId } = (0, settings_store_1.useSettingsStore)();
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(false);
    const realtimeRef = (0, react_1.useRef)(null);
    // Initialize auth on mount
    (0, react_1.useEffect)(() => {
        initialize();
    }, []);
    // Redirect if not authenticated after initialization
    (0, react_1.useEffect)(() => {
        if (isInitialized && !user) {
            router.replace(needsSetup ? '/register' : '/login');
        }
    }, [isInitialized, user, needsSetup]);
    (0, react_1.useEffect)(() => {
        if (!user)
            return;
        // Online/offline detection
        const updateOnline = () => setOnline(navigator.onLine);
        window.addEventListener('online', updateOnline);
        window.addEventListener('offline', updateOnline);
        updateOnline();
        // Start offline sync engine
        const tenantId = user.tenant?.id || user.tenantId || '';
        sync_1.syncEngine.start(activeBranchId || user.branchId || '', tenantId);
        // Check pending sales count
        const checkPending = async () => {
            try {
                const pending = await db_1.db.getPendingSales(tenantId);
                setPendingSyncCount(pending.length);
            }
            catch { }
        };
        checkPending();
        const interval = setInterval(checkPending, 30_000);
        // Supabase Realtime – subscribe to notifications
        const supabase = (0, client_1.createClient)();
        realtimeRef.current = supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Notification' }, (payload) => {
            const n = payload.new;
            if (!n.userId || n.userId === user.id) {
                (0, react_hot_toast_1.default)(n.titleAr || n.title || 'إشعار جديد', { icon: '🔔', duration: 4000 });
            }
        })
            .subscribe();
        return () => {
            window.removeEventListener('online', updateOnline);
            window.removeEventListener('offline', updateOnline);
            clearInterval(interval);
            sync_1.syncEngine.stop();
            realtimeRef.current?.unsubscribe();
        };
    }, [user?.id, activeBranchId]);
    if (!isInitialized) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950", children: (0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" }) }));
    }
    if (!user)
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.Sidebar, { isOpen: sidebarOpen, onClose: () => setSidebarOpen(false) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col overflow-hidden", children: [(0, jsx_runtime_1.jsx)(Header_1.Header, { onMenuClick: () => setSidebarOpen(true) }), (0, jsx_runtime_1.jsx)("main", { className: "flex-1 overflow-y-auto p-4 lg:p-6", children: children })] })] }));
}
//# sourceMappingURL=layout.js.map