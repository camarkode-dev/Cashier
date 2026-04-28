'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';
import toast from 'react-hot-toast';
import {
  Store, User, Mail, Lock, Phone, ShieldCheck,
  ArrowRight, Loader2, CheckCircle, UserPlus,
} from 'lucide-react';

// ─── Contact Admin View ───────────────────────────────────────────────────────

function ContactAdminView() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <ShieldCheck size={32} className="text-brand-500" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
        الوصول بموجب إذن مسبق
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
        لا يمكن إنشاء حسابات بشكل مستقل. يتولى مدير النظام إنشاء الحسابات
        وتحديد صلاحيات الوصول لكل مستخدم وفقاً لمتطلبات العمل.
      </p>
      <div className="space-y-3 text-start mb-8">
        {[
          { icon: Phone,    text: 'تواصل مع مدير النظام أو المسؤول المختص في مؤسستك.' },
          { icon: UserPlus, text: 'سيقوم المدير بإنشاء حسابك وتحديد صلاحياتك المناسبة.' },
          { icon: Mail,     text: 'ستصلك بيانات الدخول مباشرةً منه عبر البريد الإلكتروني.' },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
            <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={14} className="text-brand-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
      <Link href="/login" className="w-full btn-brand py-3 flex items-center justify-center gap-2 text-sm font-semibold">
        <ArrowRight size={18} className="rotate-180" />
        العودة إلى تسجيل الدخول
      </Link>
    </div>
  );
}

// ─── Initial Setup Form ───────────────────────────────────────────────────────

function SetupForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ message: string; confirmEmail: boolean } | null>(null);
  const [form, setForm] = useState({
    storeName: '',
    firstName: '', lastName: '',
    email: '', password: '', phone: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const nextStep = () => {
    if (!form.storeName.trim()) { toast.error('اسم المتجر مطلوب'); return; }
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { toast.error('الاسم الكامل مطلوب'); return; }
    if (!form.email) { toast.error('البريد الإلكتروني مطلوب'); return; }
    if (form.password.length < 8) { toast.error('كلمة المرور 8 أحرف على الأقل'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'فشل الإعداد');
      setDone({ message: json.data.message, confirmEmail: json.data.emailConfirmationRequired });
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-50 dark:bg-green-950 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">تم إعداد النظام</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">{done.message}</p>
        {done.confirmEmail && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6 text-start">
            <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold mb-1">تنبيه: تأكيد البريد الإلكتروني</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              تحقق من بريدك الإلكتروني واضغط رابط التفعيل، ثم عد لتسجيل الدخول.
              أو يمكنك تعطيل تأكيد البريد من إعدادات Supabase &rarr; Authentication &rarr; Email &rarr; Confirm email.
            </p>
          </div>
        )}
        <button onClick={() => router.replace('/login')} className="w-full btn-brand py-3 flex items-center justify-center gap-2">
          <ArrowRight size={18} className="rotate-180" />
          تسجيل الدخول
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Store size={32} className="text-brand-500" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-1">
        إعداد النظام
      </h1>
      <p className="text-gray-500 text-center text-sm mb-6">
        {step === 1 ? 'أدخل اسم متجرك لبدء الإعداد الأولي' : 'بيانات حساب المالك'}
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-3 justify-center mb-6">
        {[
          { n: 1, label: 'المتجر', icon: Store },
          { n: 2, label: 'المالك', icon: User },
        ].map(({ n, label, icon: Icon }, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= n ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
              <Icon size={14} />
            </div>
            <span className={`text-xs font-medium ${step === n ? 'text-brand-500' : 'text-gray-400'}`}>{label}</span>
            {i === 0 && <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); nextStep(); } : submit} className="space-y-4">
        {step === 1 && (
          <div>
            <label className="label">اسم المتجر *</label>
            <input
              className="input"
              placeholder="أولاد أيمن للأدوات المنزلية"
              value={form.storeName}
              onChange={e => set('storeName', e.target.value)}
              autoFocus
            />
          </div>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">الاسم الأول *</label>
                <input className="input" placeholder="أيمن" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
              </div>
              <div>
                <label className="label">الاسم الأخير *</label>
                <input className="input" placeholder="محمد" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">البريد الإلكتروني *</label>
              <input className="input" type="email" placeholder="admin@store.com" value={form.email} onChange={e => set('email', e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="label">كلمة المرور *</label>
              <input className="input" type="password" placeholder="8 أحرف على الأقل" value={form.password} onChange={e => set('password', e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input className="input" type="tel" placeholder="+201001234567" value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr" />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-1">
          {step === 2 && (
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              السابق
            </button>
          )}
          <button type="submit" disabled={loading}
            className="flex-1 btn-brand py-3 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : step === 1
                ? <><span>التالي</span><ArrowRight size={18} /></>
                : <span>إنشاء النظام</span>
            }
          </button>
        </div>
      </form>

      <div className="mt-5 text-center text-sm text-gray-500">
        لديك حساب؟{' '}
        <Link href="/login" className="text-brand-500 hover:text-brand-600 font-semibold">تسجيل الدخول</Link>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [status, setStatus] = useState<'loading' | 'setup' | 'contact'>('loading');

  useEffect(() => {
    fetch('/api/setup/status')
      .then(r => r.json())
      .then(d => setStatus(d?.data?.setupRequired ? 'setup' : 'contact'))
      .catch(() => setStatus('contact'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="w-full max-w-md relative">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-center mb-6">
            <Logo size="md" variant="full" />
          </div>

          {status === 'loading' && (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-brand-500" />
            </div>
          )}
          {status === 'setup'   && <SetupForm />}
          {status === 'contact' && <ContactAdminView />}
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          نظام نقطة البيع v1.0 · أولاد أيمن للأدوات المنزلية
        </p>
      </div>
    </div>
  );
}
