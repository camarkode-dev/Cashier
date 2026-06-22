'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { BrandMark } from '@/components/common/BrandMark';

type Platform = 'android' | 'ios' | 'desktop' | null;

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
  const isAndroid = /Android/.test(ua);
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return 'desktop';
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const STORAGE_KEY = 'pwa-install-dismissed';

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const dismiss = () => {
    setVisible(false);
    setShowIOSGuide(false);
    sessionStorage.setItem(STORAGE_KEY, '1');
  };

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const currentPlatform = detectPlatform();
    setPlatform(currentPlatform);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setTimeout(() => setVisible(true), 2500);
    };

    const onInstalled = () => dismiss();

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    if (currentPlatform === 'ios') {
      setTimeout(() => setVisible(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (platform === 'ios') {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (outcome === 'accepted') dismiss();
  };

  if (!visible || (!deferredPrompt && platform !== 'ios')) return null;

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 animate-slide-up">
        <div className="mx-auto flex max-w-md items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl">
            <BrandMark size={48} title="أولاد أيمن" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">تثبيت التطبيق</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {platform === 'ios'
                ? 'أضف التطبيق إلى الشاشة الرئيسية ليعمل كتطبيق مستقل'
                : 'ثبّت التطبيق لفتحه كتطبيق مستقل وليس داخل صفحة المتصفح'}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={install}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600"
            >
              {platform === 'ios' ? <Share size={14} /> : <Download size={14} />}
              {platform === 'ios' ? 'الخطوات' : 'تثبيت'}
            </button>
            <button
              onClick={dismiss}
              className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white">إضافة إلى الشاشة الرئيسية</h3>
              <button
                onClick={dismiss}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '1',
                  text: 'اضغط زر المشاركة',
                  sub: 'الزر الموجود في شريط الأدوات السفلي',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-brand-500">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  step: '2',
                  text: 'اختر إضافة إلى الشاشة الرئيسية',
                  sub: 'مرّر لأسفل داخل قائمة الخيارات حتى تجدها',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-brand-500">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  step: '3',
                  text: 'اضغط إضافة',
                  sub: 'سيظهر التطبيق على الشاشة الرئيسية بنفس الأيقونة',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-brand-500">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ].map(({ step, text, sub, icon }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-900">
                    {step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {icon}
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{text}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={dismiss} className="btn-brand mt-6 w-full py-3 text-sm font-semibold">
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </>
  );
}
