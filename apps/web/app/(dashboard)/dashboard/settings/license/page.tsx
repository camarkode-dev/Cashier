'use client';
import { useState, useEffect } from 'react';
import { licensesApi } from '@/lib/api';
import { generateDeviceFingerprint } from '@/lib/utils';
import { Shield, Monitor, Trash2, CheckCircle, XCircle, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function LicensePage() {
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [activateKey, setActivateKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  const load = async () => {
    try {
      const [status, devs] = await Promise.all([
        licensesApi.status(),
        licensesApi.devices(),
      ]);
      setLicenseStatus((status as any)?.data || status);
      setDevices((devs as any)?.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateKey.trim()) return;
    setActivating(true);
    try {
      const fingerprint = generateDeviceFingerprint();
      const deviceName = navigator.userAgent.substring(0, 50);
      await licensesApi.activate(activateKey, fingerprint, deviceName);
      toast.success('تم تفعيل الترخيص بنجاح');
      setActivateKey('');
      load();
    } catch {}
    setActivating(false);
  };

  const handleDeactivate = async (deviceId: string) => {
    if (!confirm('هل تريد إلغاء تفعيل هذا الجهاز؟')) return;
    try {
      await licensesApi.deactivate(deviceId);
      toast.success('تم إلغاء التفعيل');
      load();
    } catch {}
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
        <Shield className="text-brand-500" size={24} />
        إدارة الترخيص
      </h2>

      {/* Current license status */}
      {licenseStatus && (
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">الترخيص الحالي</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
              <p className="text-xs text-gray-400">النوع</p>
              <p className="font-black text-brand-500 mt-1">{licenseStatus.type}</p>
            </div>
            <div className={`rounded-2xl p-3 ${licenseStatus.status === 'ACTIVE' ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
              <p className="text-xs text-gray-400">الحالة</p>
              <p className={`font-black mt-1 ${licenseStatus.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>
                {licenseStatus.status === 'ACTIVE' ? 'نشط' : licenseStatus.status}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
              <p className="text-xs text-gray-400">الأجهزة</p>
              <p className="font-black text-gray-900 dark:text-white mt-1">{licenseStatus.activeDevices}/{licenseStatus.maxDevices}</p>
            </div>
          </div>
          {licenseStatus.expiresAt && (
            <div className="mt-3 text-sm text-center text-gray-500">
              ينتهي في: <span className="font-semibold">{new Date(licenseStatus.expiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      )}

      {/* Activate new license */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Key size={18} className="text-brand-500" />
          تفعيل ترخيص جديد
        </h3>
        <form onSubmit={handleActivate} className="flex gap-3">
          <input
            className="input flex-1 font-mono uppercase"
            placeholder="XXX-XXXX-XXXX-XXXX"
            value={activateKey}
            onChange={(e) => setActivateKey(e.target.value.toUpperCase())}
            dir="ltr"
          />
          <button type="submit" disabled={activating || !activateKey.trim()} className="btn-brand px-5 disabled:opacity-60 flex-shrink-0">
            {activating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'تفعيل'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">سيتم ربط هذا الترخيص بالجهاز الحالي تلقائياً</p>
      </div>

      {/* Devices list */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Monitor size={18} className="text-brand-500" />
          الأجهزة المفعّلة
        </h3>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : devices.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">لا توجد أجهزة مفعّلة</p>
        ) : (
          <div className="space-y-2">
            {devices.map((device: any) => (
              <div key={device.id} className={`flex items-center gap-3 p-3 rounded-xl border ${device.isActive ? 'border-green-100 dark:border-green-800 bg-green-50 dark:bg-green-950' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 opacity-60'}`}>
                <Monitor size={18} className={device.isActive ? 'text-green-500' : 'text-gray-400'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{device.deviceName || 'جهاز غير معروف'}</p>
                  <p className="text-xs text-gray-400">آخر ظهور: {formatDate(device.lastSeenAt)}</p>
                </div>
                {device.isActive ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> : <XCircle size={16} className="text-gray-400 flex-shrink-0" />}
                <button onClick={() => handleDeactivate(device.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
