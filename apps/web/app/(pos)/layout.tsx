'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, needsSetup, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace(needsSetup ? '/register' : '/login');
    }
  }, [isInitialized, isAuthenticated, needsSetup]);

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="w-8 h-8 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <div className="h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">{children}</div>;
}
