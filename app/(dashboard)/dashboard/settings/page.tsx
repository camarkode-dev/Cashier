'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bluetooth,
  CheckCircle2,
  Globe,
  PlugZap,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Upload,
  Usb,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tenantApi } from '@/lib/api';
import {
  COUNTRY_OPTIONS,
  type SupportedCountry,
  getCountryByCurrency,
  getRegionalConfig,
} from '@/lib/currency';
import { thermalPrinter } from '@/lib/printing';
import { useAuthStore } from '@/stores/auth.store';
import { type PrinterConfig, useSettingsStore } from '@/stores/settings.store';

const tabs = [
  { id: 'store', label: 'المتجر', icon: Settings },
  { id: 'printer', label: 'الطابعة', icon: Printer },
  { id: 'language', label: 'اللغة', icon: Globe },
  { id: 'security', label: 'الأمان', icon: Shield },
] as const;

export default function SettingsPage() {
  const { tenant, updateTenant } = useAuthStore();
  const {
    language,
    setLanguage,
    cashierPrinter,
    autoPrint,
    updateCashierPrinter,
    setAutoPrint,
    country,
    currency: settingsCurrency,
    setRegionalSettings,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('store');
  const [saving, setSaving] = useState(false);
  const [printerBusy, setPrinterBusy] = useState<string | null>(null);
  const [printerStatus, setPrinterStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: '',
    nameAr: '',
    phone: '',
    logo: '',
    taxRate: '0',
    country: 'EG' as SupportedCountry,
    currency: getRegionalConfig('EG').currency,
  });

  const resizeLogo = (file: File) =>
    new Promise<string>((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('يرجى اختيار صورة صالحة'));
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        reject(new Error('حجم الصورة يجب ألا يزيد عن 3 ميجابايت'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSize = 512;
          const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
          const width = Math.max(1, Math.round(image.width * ratio));
          const height = Math.max(1, Math.round(image.height * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('تعذر تجهيز الصورة'));
            return;
          }

          ctx.fillStyle = '#1d2026';
          ctx.fillRect(0, 0, maxSize, maxSize);
          ctx.drawImage(image, (maxSize - width) / 2, (maxSize - height) / 2, width, height);
          resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = () => reject(new Error('تعذر قراءة الصورة'));
        image.src = String(reader.result || '');
      };
      reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    const resolvedCountry = country || getCountryByCurrency(tenant?.currency || settingsCurrency || 'EGP');
    const resolvedCurrency = getRegionalConfig(resolvedCountry).currency;
    setStoreForm({
      name: tenant?.name || '',
      nameAr: tenant?.nameAr || '',
      phone: tenant?.phone || '',
      logo: tenant?.logo || '',
      taxRate: tenant?.taxRate?.toString() || '0',
      country: resolvedCountry,
      currency: resolvedCurrency,
    });
  }, [country, settingsCurrency, tenant]);

  const regional = useMemo(() => getRegionalConfig(storeForm.country), [storeForm.country]);

  const handleCountryChange = (value: SupportedCountry) => {
    const next = getRegionalConfig(value);
    setStoreForm((current) => ({ ...current, country: value, currency: next.currency }));
  };

  const saveStore = async () => {
    setSaving(true);
    try {
      const payload = {
        name: storeForm.name,
        nameAr: storeForm.nameAr,
        phone: storeForm.phone,
        logo: storeForm.logo || null,
        taxRate: parseFloat(storeForm.taxRate || '0'),
        currency: storeForm.currency,
        country: storeForm.country,
      };
      const updatedTenant = await tenantApi.update(payload);
      setRegionalSettings(storeForm.country, storeForm.currency);
      updateTenant(updatedTenant || payload);
      toast.success('تم حفظ إعدادات المتجر');
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file?: File | null) => {
    if (!file) return;
    try {
      const logo = await resizeLogo(file);
      setStoreForm((current) => ({ ...current, logo }));
      toast.success('تم تجهيز اللوجو، اضغط حفظ لتطبيق التغيير');
    } catch (error: any) {
      toast.error(error?.message || 'تعذر رفع اللوجو');
    }
  };

  const updatePrinter = (patch: Partial<PrinterConfig>) => {
    setPrinterStatus(null);
    updateCashierPrinter(patch);
  };

  const runPrinterAction = async (action: 'connect' | 'arabic' | 'qr') => {
    setPrinterBusy(action);
    setPrinterStatus(null);
    try {
      const result =
        action === 'connect'
          ? await thermalPrinter.testConnection(cashierPrinter)
          : action === 'qr'
            ? await thermalPrinter.printQrTest(cashierPrinter)
            : await thermalPrinter.printArabicTest(cashierPrinter);
      setPrinterStatus({ ok: result.ok, message: result.message });
      if (result.ok) updateCashierPrinter({ lastConnected: new Date().toISOString() });
    } catch (error: any) {
      setPrinterStatus({ ok: false, message: error?.message || 'تعذر تنفيذ اختبار الطابعة.' });
    } finally {
      setPrinterBusy(null);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('تأكيد كلمة المرور غير متطابق');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'فشل تغيير كلمة المرور');
      toast.success('تم تغيير كلمة المرور بنجاح');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error?.message || 'فشل تغيير كلمة المرور');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">الإعدادات</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          اضبط بيانات المتجر، العملة، الطابعة، واللغة من مكان واحد.
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
              <p className="mt-2 text-lg font-black text-brand-500">{regional.currency}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-400">تنسيق العرض</p>
              <p className="mt-2 text-lg font-black text-gray-900 dark:text-white">{regional.locale}</p>
            </div>
          </div>

          <div className="card space-y-5 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white">هوية المتجر</h3>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gray-900">
                    {storeForm.logo ? (
                      <img src={storeForm.logo} alt="لوجو المتجر" className="h-full w-full object-contain" />
                    ) : (
                      <img src="/logo-mark.png" alt="اللوجو الافتراضي" className="h-full w-full object-contain" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">لوجو المتجر</p>
                    <p className="mt-1 text-xs text-gray-400">يظهر في القائمة، شاشة البيع، والإيصال المطبوع.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="btn-secondary inline-flex cursor-pointer items-center gap-2">
                    <Upload size={16} />
                    رفع لوجو
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        handleLogoUpload(event.target.files?.[0]);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setStoreForm((current) => ({ ...current, logo: '' }))}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <RotateCcw size={16} />
                    الافتراضي
                  </button>
                </div>
              </div>
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
                <label className="label">العملة</label>
                <div className="input flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                  <span className="font-bold text-gray-900 dark:text-white">{regional.currency}</span>
                  <span className="text-xs text-gray-400">تتغير حسب الدولة</span>
                </div>
              </div>
            </div>
            <button onClick={saveStore} disabled={saving} className="btn-brand inline-flex items-center gap-2">
              {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={16} />}
              حفظ إعدادات المتجر
            </button>
          </div>
        </div>
      )}

      {activeTab === 'printer' && (
        <div className="space-y-4">
          <div className="card space-y-5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">طابعة الكاشير</h3>
                <p className="mt-1 text-sm text-gray-400">
                  فاتورة كاملة مع الأسعار، الإجمالي، الضريبة، الخصم، طريقة الدفع، بيانات العميل، QR، واللوجو إن وجد.
                </p>
              </div>
              <button
                onClick={() => updatePrinter({ isEnabled: !cashierPrinter.isEnabled })}
                className={`relative h-6 w-12 flex-shrink-0 rounded-full transition-all ${
                  cashierPrinter.isEnabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                title={cashierPrinter.isEnabled ? 'تعطيل الطابعة' : 'تفعيل الطابعة'}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    cashierPrinter.isEnabled ? 'start-6' : 'start-0.5'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="label">نوع الاتصال</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: 'usb', label: 'USB', desc: 'WebUSB مباشر', icon: Usb },
                  { id: 'bluetooth', label: 'Bluetooth', desc: 'Web Bluetooth', icon: Bluetooth },
                  { id: 'network', label: 'Network', desc: 'HTTP bridge', icon: PlugZap },
                ].map((option) => {
                  const Icon = option.icon;
                  const selected = cashierPrinter.connectionType === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => updatePrinter({ connectionType: option.id as any })}
                      className={`rounded-xl border-2 p-3 text-start transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950'
                          : 'border-gray-100 text-gray-600 hover:border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Icon size={16} />
                        {option.label}
                      </span>
                      <p className="mt-1 text-xs text-gray-400">{option.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">اسم الجهاز</label>
                <input
                  className="input"
                  value={cashierPrinter.deviceName}
                  onChange={(event) => updatePrinter({ deviceName: event.target.value })}
                  placeholder="Cashier printer"
                />
              </div>
              <div>
                <label className="label">Device ID / Address</label>
                <input
                  className="input"
                  value={cashierPrinter.deviceId || cashierPrinter.deviceAddress}
                  onChange={(event) => updatePrinter({ deviceId: event.target.value, deviceAddress: event.target.value })}
                  dir="ltr"
                  placeholder="اختياري"
                />
              </div>
            </div>

            {cashierPrinter.connectionType === 'network' && (
              <div className="grid gap-3 md:grid-cols-[1fr,160px]">
                <div>
                  <label className="label">IP الطابعة</label>
                  <input
                    className="input"
                    placeholder="192.168.1.100"
                    value={cashierPrinter.ip}
                    onChange={(event) => updatePrinter({ ip: event.target.value })}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="label">Port</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={cashierPrinter.port}
                    onChange={(event) => updatePrinter({ port: Number(event.target.value) || 3002 })}
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="label">عرض الورق</label>
                <div className="flex gap-2">
                  {(['58mm', '80mm'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => updatePrinter({ paperWidth: size })}
                      className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                        cashierPrinter.paperWidth === size
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950'
                          : 'border-gray-100 text-gray-600 dark:border-gray-800'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">مقاس الخط</label>
                <input
                  className="input"
                  type="number"
                  min={0.75}
                  max={1.4}
                  step={0.05}
                  value={cashierPrinter.fontScale}
                  onChange={(event) => updatePrinter({ fontScale: Number(event.target.value) || 1 })}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label">عدد المحاولات</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={5}
                  value={cashierPrinter.retryAttempts}
                  onChange={(event) => updatePrinter({ retryAttempts: Number(event.target.value) || 0 })}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800">
              <span className="text-gray-400">آخر اتصال: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {cashierPrinter.lastConnected ? new Date(cashierPrinter.lastConnected).toLocaleString('ar-EG') : 'لم يتم الاتصال بعد'}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                onClick={() => runPrinterAction('connect')}
                disabled={!!printerBusy || !cashierPrinter.isEnabled}
                className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <PlugZap size={16} />
                {printerBusy === 'connect' ? 'جار الاختبار...' : 'اختبار اتصال'}
              </button>
              <button
                onClick={() => runPrinterAction('arabic')}
                disabled={!!printerBusy || !cashierPrinter.isEnabled}
                className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Printer size={16} />
                {printerBusy === 'arabic' ? 'جار الطباعة...' : 'اختبار عربي'}
              </button>
              <button
                onClick={() => runPrinterAction('qr')}
                disabled={!!printerBusy || !cashierPrinter.isEnabled}
                className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <QrCode size={16} />
                {printerBusy === 'qr' ? 'جار الطباعة...' : 'اختبار QR'}
              </button>
            </div>

            {printerStatus && (
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                  printerStatus.ok
                    ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {printerStatus.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {printerStatus.message}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
            <div>
              <p className="text-sm font-semibold">طباعة تلقائية بعد الدفع</p>
              <p className="mt-0.5 text-xs text-gray-400">فشل الطباعة لا يمنع إتمام البيع.</p>
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
              { id: 'ar', label: 'عربي' },
              { id: 'en', label: 'English' },
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
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card mx-auto max-w-md space-y-4 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white">تغيير كلمة المرور</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">كلمة المرور الحالية</label>
              <input
                className="input"
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="label">كلمة المرور الجديدة</label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">تأكيد كلمة المرور الجديدة</label>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn-brand flex w-full items-center justify-center gap-2" disabled={changingPassword}>
              {changingPassword ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={16} />}
              تغيير كلمة المرور
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
