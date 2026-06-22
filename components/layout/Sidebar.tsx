'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ShoppingCart, Package, Users,
  Settings, Truck, DollarSign, GitBranch, Bell, ShieldCheck,
  LogOut, ChevronRight, ArrowLeftRight, ReceiptText, TrendingUp, Tag, Landmark, ClipboardList,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { label: 'نقطة البيع', href: '/pos', icon: ShoppingCart },
  { label: 'المنتجات', href: '/dashboard/products', icon: Package },
  { label: 'الفئات', href: '/dashboard/categories', icon: Tag, roles: ['OWNER', 'ADMIN'] },
  { label: 'العملاء', href: '/dashboard/customers', icon: Users },
  { label: 'فواتير الآجل', href: '/dashboard/credit-invoices', icon: Landmark },
  { label: 'المبيعات', href: '/dashboard/sales', icon: ReceiptText },
  { label: 'طلبات التطبيق', href: '/dashboard/app-orders', icon: ClipboardList, roles: ['OWNER', 'ADMIN'] },
  { label: 'المخزون', href: '/dashboard/inventory', icon: ArrowLeftRight, roles: ['OWNER', 'ADMIN'] },
  { label: 'الموردون', href: '/dashboard/suppliers', icon: Truck, roles: ['OWNER', 'ADMIN'] },
  { label: 'المصروفات', href: '/dashboard/expenses', icon: DollarSign, roles: ['OWNER', 'ADMIN'] },
  { label: 'الفروع', href: '/dashboard/branches', icon: GitBranch, roles: ['OWNER', 'ADMIN'] },
  { label: 'المستخدمون', href: '/dashboard/users', icon: ShieldCheck, roles: ['OWNER', 'ADMIN'] },
  { label: 'التقارير', href: '/dashboard/reports', icon: TrendingUp, roles: ['OWNER', 'ADMIN'] },
  { label: 'الإشعارات', href: '/dashboard/notifications', icon: Bell },
  { label: 'الإعدادات', href: '/dashboard/settings', icon: Settings, roles: ['OWNER', 'ADMIN'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { pendingSyncCount, isOnline } = useSettingsStore();

  const filteredNav = navItems.filter((item) => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 start-0 h-full w-64 bg-white dark:bg-gray-900 border-e border-gray-200 dark:border-gray-800 z-40 flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
      )}>
        {/* Logo area */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <Logo size="sm" variant="horizontal" />
        </div>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="mx-3 mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs font-medium text-center">
            وضع عدم الاتصال
            {pendingSyncCount > 0 && ` · ${pendingSyncCount} في الانتظار`}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                )}
              >
                <Icon size={18} className={cn('flex-shrink-0', isActive ? 'text-brand-500' : '')} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-50 rotate-180" />}
                {item.badge ? (
                  <span className="bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 mb-2">
            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all font-medium"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
