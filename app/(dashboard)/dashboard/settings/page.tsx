'use client';

import { useEffect, useMemo, useState } from 'react';
import { Globe, Printer, Save, Settings, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { tenantApi } from '@/lib/api';
import {
  COUNTRY_OPTIONS,
  type SupportedCountry,
  getCountryByCurrency,
  getRegionalConfig,
} from '@/lib/currency';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';

const tabs = [
  { id: 'store', label: 'المتجر', icon: Settings },
  { id: 'printer', label: 'الطابعة', icon: Printer },
  { id: 'language', label: 'اللغة', icon: Globe },
] as const;

export default function SettingsPage() {
  const { tenant, updateTenant } = useAuthStore();
  const {
    language,
    setLanguage,
    printerType,
    paperSize,
    autoPrint,
    setPrinterConfig,
    setAutoPrint,
    country,
    currency: settingsCurrency,
    setRegionalSettings,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('store');
  const [saving, setSaving] = useState(false);
  const [printerIpInput, setPrinterIpInput] = useState('');
  const [storeForm, setStoreForm] = useState({
    name: '',
    nameAr: '',
    phone: '',
    taxRate: '0',
    country: 'EG' as SupportedCountry,
    currency: getRegionalConfig('EG').currency,
  });

  useEffect(() => {
    const resolvedCurrency = tenant?.currency || settingsCurrency || 'EGP';
    const resolvedCountry = getCountryByCurrency(resolvedCurrency) || country;

    setStoreForm({
      name: tenant?.name || '',
      nameAr: tenant?.nameAr || '',
      phone: tenant?.phone || '',
      taxRate: tenant?.taxRate?.toString() || '0',
      country: resolvedCountry,
      currency: resolvedCurrency,
    });
  }, [tenant, country, settingsCurrency]);

  const regional = useMemo(() => getRegionalConfig(storeForm.country), [storeForm.country]);

  const handleCountryChange = (value: SupportedCountry) => {
    const next = getRegionalConfig(value);
    setStoreForm((current) => ({
      ...current,
      country: value,
      currency: next.currency,
    }));
  };

  const saveStore = async () => {
    setSaving(true);
    try {
      const payload = {
        name: storeForm.name,
        nameAr: storeForm.nameAr,
        phone: storeForm.phone,
        taxRate: parseFloat(storeForm.taxRate || '0'),
        currency: storeForm.currency,
        country: storeForm.country,
      };

      await tenantApi.update(payload);
      setRegionalSettings(storeForm.country, storeForm.currency);
      updateTenant({
        name: storeForm.name,
        nameAr: storeForm.nameAr,
        phone: storeForm.phone,
        currency: storeForm.currency,
        taxRate: parseFloat(storeForm.taxRate || '0'),
      });
      toast.success('تم حفظ إعدادات المتجر');
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">الإعدادات</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          اضبط بيانات المتجر، الدولة الأساسية، العملة، والطابعة من مكان واحد.
        </p>
      </div>

      <div className="flex gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Icon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === 'store' && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="card p-4">
              <p className="text-xs text-gray-400">الدولة الحالية</p>
              <p className="mt-2 text-lg font-black text-gray-900 dark:text-white">{regional.label}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-400">العملة الموحدة</p>
              <div className="mt-2 flex items-center gap-2">
                <Wallet size={16} className="text-brand-500" />
                <p className="text-lg font-black text-brand-500">{regional.currency}</p>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-400">تنسيق العرض</p>
              <p className="mt-2 text-lg font-black text-gray-900 dark:text-white">{regional.locale}</p>
            </div>
          </div>

          <div className="card space-y-5 p-5">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">هوية المتجر</h3>
              <p className="mt-1 text-sm text-gray-400">
                اختيار الدولة يضبط العملة تلقائيًا في شاشة البيع، التقارير، والفواتير.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">اسم المتجر بالعربية</label>
                <input
                  className="input"
                  value={storeForm.nameAr}
                  onChange={(event) => setStoreForm((current) => ({ ...current, nameAr: event.target.value }))}
                />
              </div>
              <div>
                <label className="label">اسم المتجر بالإنجليزية</label>
                <input
                  className="input"
                  value={storeForm.name}
                  onChange={(event) => setStoreForm((current) => ({ ...current, name: event.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">رقم الهاتف</label>
                <input
                  className="input"
                  type="tel"
                  value={storeForm.phone}
                  onChange={(event) => setStoreForm((current) => ({ ...current, phone: event.target.value }))}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label">نسبة الضريبة %</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={storeForm.taxRate}
                  onChange={(event) => setStoreForm((current) => ({ ...current, taxRate: event.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">الدولة الأساسية</label>
                <select
                  className="input"
                  value={storeForm.country}
                  onChange={(event) => handleCountryChange(event.target.value as SupportedCountry)}
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.country} value={option.country}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">العملة المستخدمة في التطبيق</label>
                <div className="input flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                  <span className="font-bold text-gray-900 dark:text-white">{regional.currency}</span>
                  <span className="text-xs text-gray-400">تتغير تلقائيًا حسب الدولة</span>
                </div>
              </div>
            </div>

            <button onClick={saveStore} disabled={saving} className="btn-brand inline-flex items-center gap-2">
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save size={16} />
              )}
              حفظ إعدادات المتجر
            </button>
          </div>
        </div>
      )}

      {activeTab === 'printer' && (
        <div className="card space-y-4 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white">إعدادات الطابعة</h3>

          <div>
            <label className="label">نوع الاتصال</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'browser', label: 'المتصفح', desc: 'نافذة الطباعة الافتراضية' },
                { id: 'usb', label: 'USB مباشر', desc: 'مناسب لكروم على سطح المكتب' },
                { id: 'network', label: 'شبكة IP', desc: 'لطابعة متصلة على الشبكة' },
                { id: 'bridge', label: 'خدمة محلية', desc: 'عبر برنامج الجسر المحلي' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPrinterConfig(option.id as any, printerIpInput, paperSize)}
                  className={`rounded-xl border-2 p-3 text-start transition-all ${
                    printerType === option.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                      : 'border-gray-100 hover:border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {printerType === 'network' && (
            <div>
              <label className="label">IP الطابعة</label>
              <input
                className="input"
                placeholder="192.168.1.100"
                value={printerIpInput}
                onChange={(event) => setPrinterIpInput(event.target.value)}
                dir="ltr"
              />
            </div>
          )}

          <div>
            <label className="label">حجم الورق</label>
            <div className="flex gap-3">
              {(['58mm', '80mm'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setPrinterConfig(printerType, printerIpInput, size)}
                  className={`rounded-xl border-2 px-6 py-2.5 text-sm font-semibold transition-all ${
                    paperSize === size
                      ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950'
                      : 'border-gray-100 text-gray-600 dark:border-gray-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
            <div>
              <p className="text-sm font-semibold">طباعة تلقائية بعد الدفع</p>
              <p className="mt-0.5 text-xs text-gray-400">لطباعة الإيصال مباشرة بعد إنهاء العملية</p>
            </div>
            <button
              onClick={() => setAutoPrint(!autoPrint)}
              className={`relative h-6 w-12 rounded-full transition-all ${
                autoPrint ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  autoPrint ? 'start-6' : 'start-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'language' && (
        <div className="card space-y-4 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white">اللغة والعرض</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'ar', label: 'عربي', flag: '🇪🇬' },
              { id: 'en', label: 'English', flag: '🇬🇧' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id as 'ar' | 'en')}
                className={`rounded-2xl border-2 p-4 text-center font-bold transition-all ${
                  language === lang.id
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950'
                    : 'border-gray-100 text-gray-600 dark:border-gray-800'
                }`}
              >
                <p className="mb-1 text-2xl">{lang.flag}</p>
                <p>{lang.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
