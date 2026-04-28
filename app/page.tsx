'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function RootPage() {
  const router = useRouter();
  const { authIssue, isAuthenticated, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) return;
    if (authIssue === 'unavailable') return;

    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [authIssue, isAuthenticated, isInitialized, router]);

  if (isInitialized && authIssue === 'unavailable') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          <p className="text-gray-500 font-medium">جارٍ التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
        <p className="text-gray-500 font-medium">جاري التحميل...</p>
      </div>
    </div>
  );
}
