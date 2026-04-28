'use client';
import { useState, useEffect } from 'react';
import { tenantApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { Settings, Printer, Globe, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const tabs = [
  { id: 'store', label: 'المتجر', icon: Settings },
  { id: 'printer', label: 'الطابعة', icon: Printer },
  { id: 'language', label: 'اللغة', icon: Globe },
  { id: 'license', label: 'الترخيص', icon: Shield },
];

export default function SettingsPage() {
  const { tenant, updateTenant } = useAuthStore();
  const { language, setLanguage, printerType, paperSize, autoPrint, setPrinterConfig, setAutoPrint } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('store');
  const [storeForm, setStoreForm] = useState({ name: '', nameAr: '', phone: '', address: '', taxRate: '', currency: 'EGP' });
  const [printerIpInput, setPrinterIpInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setStoreForm({ name: tenant.name || '', nameAr: (tenant as any).nameAr || '', phone: (tenant as any).phone || '', address: (tenant as any).address || '', taxRate: tenant.taxRate?.toString() || '0', currency: tenant.currency || 'EGP' });
    }
  }, [tenant]);

  const saveStore = async () => {
    setSaving(true);
    try {
      await tenantApi.update({ ...storeForm, taxRate: parseFloat(storeForm.taxRate) });
      updateTenant({ name: storeForm.name, currency: storeForm.currency, taxRate: parseFloat(storeForm.taxRate) });
      toast.success('تم حفظ الإعدادات');
    } catch {}
    setSaving(false);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-xl font-black text-gray-900 dark:text-white">الإعدادات</h2>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              <Icon size={15} /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Store settings */}
      {activeTab === 'store' && (
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">بيانات المتجر</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">اسم المتجر (عربي)</label><input className="input" value={storeForm.nameAr} onChange={(e) => setStoreForm((f) => ({ ...f, nameAr: e.target.value }))} /></div>
            <div><label className="label">اسم المتجر (إنجليزي)</label><input className="input" value={storeForm.name} onChange={(e) => setStoreForm((f) => ({ ...f, name: e.target.value }))} dir="ltr" /></div>
          </div>
          <div><label className="label">الهاتف</label><input className="input" type="tel" value={storeForm.phone} onChange={(e) => setStoreForm((f) => ({ ...f, phone: e.target.value }))} dir="ltr" /></div>
          <div><label className="label">العنوان</label><input className="input" value={storeForm.address} onChange={(e) => setStoreForm((f) => ({ ...f, address: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">العملة</label>
              <select className="input" value={storeForm.currency} onChange={(e) => setStoreForm((f) => ({ ...f, currency: e.target.value }))}>
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
              </select>
            </div>
            <div><label className="label">نسبة الضريبة %</label><input className="input" type="number" step="0.01" value={storeForm.taxRate} onChange={(e) => setStoreForm((f) => ({ ...f, taxRate: e.target.value }))} dir="ltr" /></div>
          </div>
          <button onClick={saveStore} disabled={saving} className="btn-brand flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            حفظ الإعدادات
          </button>
        </div>
      )}

      {/* Printer settings */}
      {activeTab === 'printer' && (
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">إعدادات الطابعة</h3>
          <div>
            <label className="label">نوع الاتصال</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'browser', label: 'متصفح (افتراضي)', desc: 'طباعة عبر نافذة المتصفح' },
                { id: 'usb', label: 'USB مباشر', desc: 'WebUSB — Chrome فقط' },
                { id: 'network', label: 'شبكة IP', desc: 'طابعة متصلة بالشبكة' },
                { id: 'bridge', label: 'خدمة محلية', desc: 'برنامج الجسر المحلي' },
              ].map((opt) => (
                <button key={opt.id} onClick={() => setPrinterConfig(opt.id as any, printerIpInput, paperSize)} className={`text-start p-3 rounded-xl border-2 transition-all ${printerType === opt.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'}`}>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {printerType === 'network' && (
            <div><label className="label">IP الطابعة</label><input className="input" placeholder="192.168.1.100" value={printerIpInput} onChange={(e) => setPrinterIpInput(e.target.value)} dir="ltr" /></div>
          )}
          <div>
            <label className="label">حجم الورق</label>
            <div className="flex gap-3">
              {(['58mm', '80mm'] as const).map((s) => (
                <button key={s} onClick={() => setPrinterConfig(printerType, printerIpInput, s)} className={`px-6 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${paperSize === s ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600' : 'border-gray-100 dark:border-gray-800 text-gray-600'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div><p className="font-semibold text-sm">طباعة تلقائية بعد الدفع</p><p className="text-xs text-gray-400 mt-0.5">طباعة الإيصال فوراً دون تأكيد</p></div>
            <button onClick={() => setAutoPrint(!autoPrint)} className={`w-12 h-6 rounded-full transition-all relative ${autoPrint ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${autoPrint ? 'start-6' : 'start-0.5'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Language settings */}
      {activeTab === 'language' && (
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">اللغة والعرض</h3>
          <div className="grid grid-cols-2 gap-3">
            {[{ id: 'ar', label: 'عربي', flag: '🇪🇬' }, { id: 'en', label: 'English', flag: '🇬🇧' }].map((lang) => (
              <button key={lang.id} onClick={() => setLanguage(lang.id as 'ar' | 'en')} className={`p-4 rounded-2xl border-2 text-center font-bold transition-all ${language === lang.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600' : 'border-gray-100 dark:border-gray-800 text-gray-600'}`}>
                <p className="text-2xl mb-1">{lang.flag}</p>
                <p>{lang.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* License */}
      {activeTab === 'license' && (
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">إدارة الترخيص</h3>
          {tenant?.license ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3"><p className="text-gray-400 text-xs">نوع الترخيص</p><p className="font-bold mt-1">{(tenant.license as any)?.type}</p></div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3"><p className="text-gray-400 text-xs">الحالة</p><p className="font-bold mt-1 text-green-500">{(tenant.license as any)?.status}</p></div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3"><p className="text-gray-400 text-xs">الأجهزة</p><p className="font-bold mt-1">{(tenant.license as any)?.maxDevices}</p></div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3"><p className="text-gray-400 text-xs">المستخدمون</p><p className="font-bold mt-1">{(tenant.license as any)?.maxUsers}</p></div>
              </div>
              {(tenant.license as any)?.expiresAt && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
                  ينتهي في: {new Date((tenant.license as any).expiresAt).toLocaleDateString('ar-EG')}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Shield size={48} className="mx-auto mb-3 opacity-30" />
              <p>لا يوجد ترخيص مفعّل</p>
            </div>
          )}
          <Link href="/dashboard/settings/license" className="block w-full text-center btn-brand py-3 rounded-xl">
            إدارة الترخيص والأجهزة
          </Link>
        </div>
      )}
    </div>
  );
}
