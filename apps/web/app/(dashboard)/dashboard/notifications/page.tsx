'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Bell, BellOff, Package, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'LOW_STOCK' | 'SALE' | 'SYSTEM' | 'INFO';
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  LOW_STOCK: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
  SALE: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
  SYSTEM: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  INFO: { icon: Bell, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `منذ ${d} ${d === 1 ? 'يوم' : 'أيام'}`;
  if (h > 0) return `منذ ${h} ${h === 1 ? 'ساعة' : 'ساعات'}`;
  if (m > 0) return `منذ ${m} دقيقة`;
  return 'الآن';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/notifications');
      setNotifications(res?.data || []);
    } catch { toast.error('فشل تحميل الإشعارات'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('تم تحديد الكل كمقروء');
    } catch { toast.error('فشل'); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { toast.error('فشل الحذف'); }
  };

  const clearAll = async () => {
    try {
      await apiClient.delete('/notifications');
      setNotifications([]);
      toast.success('تم حذف جميع الإشعارات');
    } catch { toast.error('فشل'); }
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">الإشعارات</h2>
          {unreadCount > 0 && (
            <span className="bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-brand-500 hover:text-brand-600 font-semibold px-3 py-1.5 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors">
              تحديد الكل كمقروء
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="text-sm text-red-400 hover:text-red-500 font-semibold px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center gap-1.5">
              <Trash2 size={14} />
              مسح الكل
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setFilter('all')}
          className={cn('pb-2.5 px-1 text-sm font-semibold border-b-2 transition-colors', filter === 'all' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-gray-600')}
        >
          جميع الإشعارات ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn('pb-2.5 px-1 text-sm font-semibold border-b-2 transition-colors', filter === 'unread' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-gray-600')}
        >
          غير مقروء ({unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-48" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="card py-20 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
            <BellOff size={52} className="mb-4 opacity-50" />
            <p className="font-medium text-gray-400">لا توجد إشعارات</p>
            {filter === 'unread' && <p className="text-sm text-gray-300 mt-1">كل الإشعارات مقروءة</p>}
          </div>
        ) : (
          filtered.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.isRead) markRead(n.id); }}
                className={cn(
                  'card p-4 flex items-start gap-4 transition-all cursor-pointer group',
                  !n.isRead ? 'border-brand-100 dark:border-brand-900 bg-brand-50/30 dark:bg-brand-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                )}
              >
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', config.bg)}>
                  <Icon size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-semibold', !n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
                      {n.titleAr || n.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-300 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.messageAr || n.message}</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
