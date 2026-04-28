'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { syncEngine } from '@/lib/sync';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initialize, isInitialized, needsSetup } = useAuthStore();
  const { setOnline, setPendingSyncCount, activeBranchId } = useSettingsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const realtimeRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, []);

  // Redirect if not authenticated after initialization
  useEffect(() => {
    if (isInitialized && !user) {
      router.replace(needsSetup ? '/register' : '/login');
    }
  }, [isInitialized, user, needsSetup]);

  useEffect(() => {
    if (!user) return;

    // Online/offline detection
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    updateOnline();

    // Start offline sync engine
    const tenantId = user.tenant?.id || user.tenantId || '';
    syncEngine.start(activeBranchId || user.branchId || '', tenantId);

    // Check pending sales count
    const checkPending = async () => {
      try {
        const pending = await db.getPendingSales(tenantId);
        setPendingSyncCount(pending.length);
      } catch {}
    };
    checkPending();
    const interval = setInterval(checkPending, 30_000);

    // Supabase Realtime – subscribe to notifications
    const supabase = createClient();
    realtimeRef.current = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Notification' },
        (payload) => {
          const n = payload.new as any;
          if (!n.userId || n.userId === user.id) {
            toast(n.titleAr || n.title || 'إشعار جديد', { icon: '🔔', duration: 4000 });
          }
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      clearInterval(interval);
      syncEngine.stop();
      realtimeRef.current?.unsubscribe();
    };
  }, [user?.id, activeBranchId]);

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
