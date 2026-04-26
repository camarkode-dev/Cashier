'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { Logo } from '@/components/common/Logo';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Wifi, WifiOff, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { isOnline } = useSettingsStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('يرجى ملء جميع الحقول'); return; }
    try {
      await login(form.email, form.password);
      toast.success('تم تسجيل الدخول بنجاح');
      router.replace('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" variant="full" />
          </div>

          {/* Offline indicator */}
          {!isOnline && (
            <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
              <WifiOff size={16} />
              <span>أنت غير متصل بالإنترنت. بعض الميزات قد تكون محدودة.</span>
            </div>
          )}

          <h1 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-1">تسجيل الدخول</h1>
          <p className="text-gray-500 text-center text-sm mb-8">أدخل بيانات حسابك للمتابعة</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                className="input"
                placeholder="example@store.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
                dir="ltr"
              />
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pe-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-brand py-3 text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
            <ShieldAlert size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              الوصول إلى النظام يكون بموجب حساب صادر من مدير النظام فقط.
              للحصول على بيانات الدخول، يرجى التواصل مع المسؤول المختص.
            </p>
          </div>

          {/* Connection status */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            {isOnline ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-500" />}
            {isOnline ? 'متصل' : 'غير متصل'}
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-gray-500 text-xs mt-4">
          نظام نقطة البيع v1.0 · أولاد أيمن للأدوات المنزلية
        </p>
      </div>
    </div>
  );
}
