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
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
            <BrandMark size={48} title="أولاد أيمن" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm">تثبيت التطبيق</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {platform === 'ios'
                ? 'أضف التطبيق إلى الشاشة الرئيسية بنفس الشعار'
                : 'ثبّت التطبيق ليفتح كتطبيق مستقل وليس داخل صفحة المتصفح'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              {platform === 'ios' ? <Share size={14} /> : <Download size={14} />}
              {platform === 'ios' ? 'الخطوات' : 'تثبيت'}
            </button>
            <button
              onClick={dismiss}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 dark:text-white">إضافة إلى الشاشة الرئيسية</h3>
              <button
                onClick={dismiss}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-brand-500">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  step: '2',
                  text: 'اختر إضافة إلى الشاشة الرئيسية',
                  sub: 'مرر لأسفل داخل قائمة الخيارات حتى تجدها',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-brand-500">
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-brand-500">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ].map(({ step, text, sub, icon }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center flex-shrink-0 font-bold text-brand-600 text-sm">
                    {step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {icon}
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{text}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={dismiss} className="w-full mt-6 btn-brand py-3 text-sm font-semibold">
              فهمت، شكرًا
            </button>
          </div>
        </div>
      )}
    </>
  );
}
