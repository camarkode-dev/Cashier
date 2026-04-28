'use client';
import { useState, useEffect } from 'react';
import { productsApi, branchesApi } from '@/lib/api';
import { resolveAppCurrency } from '@/lib/currency';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency } from '@/lib/utils';
import { Package, ArrowLeftRight, AlertTriangle, Plus, Minus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  nameAr?: string;
  barcode?: string;
  sku?: string;
  price: number;
  category?: { name: string; nameAr?: string; color?: string };
  inventory: { id: string; branchId: string; quantity: number; minStock: number }[];
}

interface Branch {
  id: string;
  name: string;
  nameAr?: string;
}

export default function InventoryPage() {
  const { activeBranchId, country: settingsCountry, currency: settingsCurrency } = useSettingsStore();
  const { tenant } = useAuthStore();
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(activeBranchId || 'all');
  const [search, setSearch] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [transfer, setTransfer] = useState({ productId: '', fromBranchId: '', toBranchId: '', quantity: 1, notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'inventory' | 'lowstock'>('inventory');

  const cur = resolveAppCurrency(tenant?.currency, settingsCountry, settingsCurrency);

  const load = async () => {
    setLoading(true);
    try {
      const [prodRes, branchRes]: any[] = await Promise.all([
        productsApi.list({ limit: 500, withInventory: true }),
        branchesApi.list(),
      ]);
      setProducts(prodRes?.data || []);
      setBranches(branchRes?.data || []);
    } catch {
      toast.error('فشل تحميل البيانات');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getStock = (product: InventoryItem, branchId?: string) => {
    if (!branchId || branchId === 'all') {
      return product.inventory?.reduce((s, i) => s + i.quantity, 0) ?? 0;
    }
    return product.inventory?.find((i) => i.branchId === branchId)?.quantity ?? 0;
  };

  const getMinStock = (product: InventoryItem, branchId?: string) => {
    if (!branchId || branchId === 'all') return product.inventory?.[0]?.minStock ?? 5;
    return product.inventory?.find((i) => i.branchId === branchId)?.minStock ?? 5;
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || (p.nameAr || p.name).toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search);
    const stock = getStock(p, selectedBranch);
    const min = getMinStock(p, selectedBranch);
    const matchView = view === 'inventory' || stock <= min;
    return matchSearch && matchView;
  });

  const lowStockCount = products.filter((p) => getStock(p, selectedBranch) <= getMinStock(p, selectedBranch)).length;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transfer.fromBranchId === transfer.toBranchId) { toast.error('الفرعان متطابقان'); return; }
    setSubmitting(true);
    try {
      await productsApi.transferStock(transfer);
      toast.success('تم نقل المخزون بنجاح');
      setShowTransfer(false);
      setTransfer({ productId: '', fromBranchId: '', toBranchId: '', quantity: 1, notes: '' });
      load();
    } catch (err: any) {
      toast.error(err?.message || 'فشل نقل المخزون');
    }
    setSubmitting(false);
  };

  const stockColor = (qty: number, min: number) => {
    if (qty <= 0) return 'text-red-500 bg-red-50 dark:bg-red-950';
    if (qty <= min) return 'text-amber-500 bg-amber-50 dark:bg-amber-950';
    return 'text-green-600 bg-green-50 dark:bg-green-950';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">إدارة المخزون</h2>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
          {branches.length > 1 && (
            <button
              onClick={() => setShowTransfer(true)}
              className="btn-brand flex items-center gap-2 py-2.5 px-4"
            >
              <ArrowLeftRight size={16} />
              نقل مخزون
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="ابحث عن منتج أو باركود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 min-w-48 py-2"
        />
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="input py-2 w-44"
        >
          <option value="all">كل الفروع</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.nameAr || b.name}</option>
          ))}
        </select>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setView('inventory')}
            className={cn('px-4 py-2 text-sm font-semibold transition-colors', view === 'inventory' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800')}
          >
            الكل
          </button>
          <button
            onClick={() => setView('lowstock')}
            className={cn('px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5', view === 'lowstock' ? 'bg-amber-500 text-white' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950')}
          >
            <AlertTriangle size={14} />
            مخزون منخفض ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 uppercase">
                <th className="text-start p-4 font-semibold">المنتج</th>
                <th className="text-start p-4 font-semibold">الباركود</th>
                <th className="text-start p-4 font-semibold">السعر</th>
                {selectedBranch === 'all' ? (
                  branches.map((b) => (
                    <th key={b.id} className="text-center p-4 font-semibold">{b.nameAr || b.name}</th>
                  ))
                ) : (
                  <th className="text-center p-4 font-semibold">الكمية</th>
                )}
                <th className="text-center p-4 font-semibold">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-40" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-28" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-16 mx-auto" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-gray-400">
                    <Package size={40} className="mx-auto mb-3 opacity-40" />
                    <p>لا توجد منتجات</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const totalStock = getStock(p, selectedBranch);
                  const minStock = getMinStock(p, selectedBranch);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: (p.category?.color || '#f97316') + '20' }}>
                            <Package size={14} style={{ color: p.category?.color || '#f97316' }} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{p.nameAr || p.name}</p>
                            {p.category && <p className="text-xs text-gray-400">{p.category.nameAr || p.category.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-500">{p.barcode || '—'}</td>
                      <td className="p-4 font-bold text-brand-500 text-sm">{formatCurrency(p.price, cur)}</td>
                      {selectedBranch === 'all' ? (
                        branches.map((b) => {
                          const inv = p.inventory?.find((i) => i.branchId === b.id);
                          const qty = inv?.quantity ?? 0;
                          const min = inv?.minStock ?? 5;
                          return (
                            <td key={b.id} className="p-4 text-center">
                              <span className={cn('inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold', stockColor(qty, min))}>
                                {qty}
                              </span>
                            </td>
                          );
                        })
                      ) : (
                        <td className="p-4 text-center">
                          <span className={cn('inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold', stockColor(totalStock, minStock))}>
                            {totalStock}
                          </span>
                        </td>
                      )}
                      <td className="p-4 text-center">
                        <span className={cn('inline-flex items-center justify-center px-3 h-7 rounded-lg text-xs font-bold', stockColor(totalStock, minStock))}>
                          {selectedBranch === 'all' ? getStock(p, 'all') : totalStock}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold flex items-center gap-2"><ArrowLeftRight size={18} className="text-brand-500" /> نقل مخزون بين الفروع</h3>
              <button onClick={() => setShowTransfer(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleTransfer} className="p-5 space-y-4">
              <div>
                <label className="label">المنتج *</label>
                <select className="input" value={transfer.productId} onChange={(e) => setTransfer((t) => ({ ...t, productId: e.target.value }))} required>
                  <option value="">اختر منتجاً...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.nameAr || p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">من فرع *</label>
                  <select className="input" value={transfer.fromBranchId} onChange={(e) => setTransfer((t) => ({ ...t, fromBranchId: e.target.value }))} required>
                    <option value="">اختر...</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.nameAr || b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">إلى فرع *</label>
                  <select className="input" value={transfer.toBranchId} onChange={(e) => setTransfer((t) => ({ ...t, toBranchId: e.target.value }))} required>
                    <option value="">اختر...</option>
                    {branches.filter((b) => b.id !== transfer.fromBranchId).map((b) => (
                      <option key={b.id} value={b.id}>{b.nameAr || b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">الكمية *</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setTransfer((t) => ({ ...t, quantity: Math.max(1, t.quantity - 1) }))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-brand-100">
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    className="input text-center flex-1"
                    value={transfer.quantity}
                    onChange={(e) => setTransfer((t) => ({ ...t, quantity: parseInt(e.target.value) || 1 }))}
                    required
                  />
                  <button type="button" onClick={() => setTransfer((t) => ({ ...t, quantity: t.quantity + 1 }))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-brand-100">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="label">ملاحظات</label>
                <input className="input" value={transfer.notes} onChange={(e) => setTransfer((t) => ({ ...t, notes: e.target.value }))} placeholder="سبب النقل..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowTransfer(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold">إلغاء</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-brand py-3 disabled:opacity-60">
                  {submitting ? 'جاري النقل...' : 'تأكيد النقل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
