'use client';

import { RefreshCw, ShieldAlert } from 'lucide-react';

interface AuthUnavailableStateProps {
  onRetry: () => void;
}

export function AuthUnavailableState({ onRetry }: AuthUnavailableStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-gray-900 shadow-xl p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600">
          <ShieldAlert size={26} />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">تعذر تحميل الجلسة الآن</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          التطبيق ما زال يرى أنك مسجل دخول، لكن بيانات الحساب لم تصل من الخادم بعد. أعد المحاولة بدل
          الرجوع لصفحة الدخول.
        </p>
        <button
          onClick={onRetry}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 font-bold text-white transition-colors hover:bg-brand-600"
        >
          <RefreshCw size={18} />
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
