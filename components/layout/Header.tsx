'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Menu, Bell, Sun, Moon, ShoppingCart, Store, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { notificationsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, tenant } = useAuthStore();
  const { isOnline, pendingSyncCount } = useSettingsStore();
  const [unread, setUnread] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    notificationsApi.unreadCount()
      .then((res: any) => setUnread(res?.data?.count || res?.count || 0))
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4 sticky top-0 z-20">
      {/* Menu button */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Menu size={20} />
      </button>

      {/* Title */}
      <div className="flex-1">
        {title && <h1 className="text-base font-bold text-gray-900 dark:text-white">{title}</h1>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Sync status */}
        {!isOnline && pendingSyncCount > 0 && (
          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-950 px-3 py-1.5 rounded-full text-xs font-medium">
            <RefreshCw size={12} className="animate-spin" />
            {pendingSyncCount} معاملة
          </div>
        )}

        {/* Online status */}
        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium', isOnline ? 'text-green-600' : 'text-red-500')}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden sm:inline">{isOnline ? 'متصل' : 'غير متصل'}</span>
        </div>

        {/* POS shortcut */}
        <Link href="/" className="flex items-center gap-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors">
          <Store size={16} />
          <span className="hidden sm:inline">المتجر</span>
        </Link>

        <Link href="/pos" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors">
          <ShoppingCart size={16} />
          <span className="hidden sm:inline">البيع</span>
        </Link>

        {/* Notifications */}
        <Link href="/dashboard/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
      </div>
    </header>
  );
}
