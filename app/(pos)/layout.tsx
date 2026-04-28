'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUnavailableState } from '@/components/common/AuthUnavailableState';
import { useAuthStore } from '@/stores/auth.store';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isInitialized, needsSetup, initialize, authIssue } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized || user || authIssue === 'unavailable') return;
    router.replace(needsSetup ? '/register' : '/login');
  }, [authIssue, isInitialized, needsSetup, router, user]);

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="w-8 h-8 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && authIssue === 'unavailable') {
    return <AuthUnavailableState onRetry={() => initialize(true)} />;
  }

  if (!user) return null;
  return <div className="h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">{children}</div>;
}
