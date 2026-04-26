'use client';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';
import { ShieldCheck, UserPlus, ArrowRight, Phone, Mail } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="w-full max-w-md relative">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" variant="full" />
          </div>

          {/* Icon */}
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

          {/* Steps */}
          <div className="space-y-3 text-start mb-8">
            {[
              { icon: Phone, text: 'تواصل مع مدير النظام أو المسؤول المختص في مؤسستك.' },
              { icon: UserPlus, text: 'سيقوم المدير بإنشاء حسابك وتحديد صلاحياتك المناسبة.' },
              { icon: Mail, text: 'ستصلك بيانات الدخول (البريد الإلكتروني وكلمة المرور) مباشرةً منه.' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={14} className="text-brand-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="w-full btn-brand py-3 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <ArrowRight size={18} className="rotate-180" />
            العودة إلى تسجيل الدخول
          </Link>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          نظام نقطة البيع v1.0 · أولاد أيمن للأدوات المنزلية
        </p>
      </div>
    </div>
  );
}
