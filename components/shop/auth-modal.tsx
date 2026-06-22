'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { Chrome, Eye, EyeOff, Loader2, Lock, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const { login, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'google'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    try {
      setBusy(true);
      await login(email.trim(), password);
      toast.success('تم تسجيل الدخول بنجاح');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تسجيل الدخول');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setBusy(true);
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تسجيل الدخول عبر Google');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">تسجيل الدخول</h2>
            <p className="text-xs text-gray-500">يظهر عند إتمام الشراء فقط</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                mode === 'login' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white' : 'text-gray-500',
              )}
            >
              بريد وكلمة مرور
            </button>
            <button
              type="button"
              onClick={() => setMode('google')}
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                mode === 'google' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white' : 'text-gray-500',
              )}
            >
              Google OAuth
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    dir="ltr"
                    className="input pe-10"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@store.com"
                  />
                </div>
              </div>
              <div>
                <label className="label">كلمة المرور</label>
                <div className="relative">
                  <Lock size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    className="input pe-10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || isLoading}
                className="btn-brand flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy || isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                دخول
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800 disabled:opacity-60"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Chrome size={18} />}
                المتابعة باستخدام Google
              </button>
              <p className="text-xs leading-6 text-gray-500">
                سيتم تحويلك إلى Google لإكمال التسجيل بأمان، ثم العودة مباشرة إلى المتجر.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
