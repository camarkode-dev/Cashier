'use client';
import { useEffect, useState } from 'react';
import { categoriesApi, productsApi } from '@/lib/api';
import { resolveAppCurrency } from '@/lib/currency';
import { cn, formatCurrency } from '@/lib/utils';
import { Plus, Search, Package, Edit2, Trash2, AlertTriangle, ScanLine } from 'lucide-react';
import { BarcodeScanner } from '@/components/pos/BarcodeScanner';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';

const emptyForm = {
  name: '',
  nameAr: '',
  price: '',
  costPrice: '',
  barcode: '',
  sku: '',
  categoryId: '',
  minStock: '5',
  taxRate: '',
  initialStock: '0',
  returnDays: '7',
};

export default function ProductsPage() {
  const { tenant } = useAuthStore();
  const { activeBranchId, country: settingsCountry, currency: settingsCurrency } = useSettingsStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showSearchScanner, setShowSearchScanner] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const cur = resolveAppCurrency(tenant?.currency, settingsCountry, settingsCurrency);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowBarcodeScanner(false);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productsApi.list({ search, categoryId: activeCategory, branchId: activeBranchId, limit: 200 }) as any,
        categoriesApi.list() as any,
      ]);

      setProducts(prods?.data?.data || prods?.data || []);
      setCategories(Array.isArray(cats?.data) ? cats.data : Array.isArray(cats) ? cats : []);
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, activeCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let categoryId = form.categoryId || undefined;
    // إذا اختار المستخدم "أخرى"، أضف الفئة الجديدة أولاً
    if (categoryId === 'other') {
      if (!newCategoryName.trim()) {
        toast.error('يرجى إدخال اسم الفئة الجديدة');
        return;
      }
      try {
        const res = await categoriesApi.create({ name: newCategoryName, nameAr: newCategoryName });
        if (res?.data?.id) {
          categoryId = res.data.id;
          // أضف الفئة الجديدة للقائمة
          setCategories((prev) => [...prev, res.data]);
        } else {
          toast.error('تعذر إضافة الفئة الجديدة');
          return;
        }
      } catch (err) {
        toast.error('تعذر إضافة الفئة الجديدة');
        return;
      }
    }
    const barcode = form.barcode.trim();
    const sku = form.sku.trim();
    const payload = {
      name: form.name.trim() || form.nameAr.trim(),
      nameAr: form.nameAr.trim() || undefined,
      price: parseFloat(form.price),
      costPrice: parseFloat(form.costPrice || '0'),
      barcode: barcode || (editing ? null : undefined),
      sku: sku || (editing ? null : undefined),
      categoryId,
      minStock: parseInt(form.minStock || '5'),
      taxRate: form.taxRate ? parseFloat(form.taxRate) : undefined,
      initialStock: parseInt(form.initialStock || '0'),
      returnDays: parseInt(form.returnDays || '7'),
      branchId: activeBranchId || undefined,
    };

    if (!payload.name) {
      toast.error('اسم المنتج مطلوب');
      return;
    }

    if (Number.isNaN(payload.price) || payload.price < 0) {
      toast.error('سعر البيع غير صالح');
      return;
    }

    if (Number.isNaN(payload.costPrice) || Number.isNaN(payload.minStock) || Number.isNaN(payload.initialStock)) {
      toast.error('تحقق من الكمية وحد التنبيه وسعر التكلفة');
      return;
    }

    try {
      if (editing) {
        await productsApi.update(editing.id, payload);
        toast.success('تم تحديث المنتج');
      } else {
        await productsApi.create(payload);
        toast.success('تم إضافة المنتج');
      }

      setShowForm(false);
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حفظ المنتج');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      await productsApi.delete(id);
      toast.success('تم الحذف');
      load();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حذف المنتج');
    }
  };

  const startEdit = (product: any) => {
    setEditing(product);
    setShowBarcodeScanner(false);
    setForm({
      name: product.name || '',
      nameAr: product.nameAr || '',
      price: product.price?.toString() || '',
      costPrice: product.costPrice?.toString() || '',
      barcode: product.barcode || '',
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      minStock: (product.minStock ?? product.inventory?.[0]?.minStock ?? 5).toString(),
      taxRate: product.taxRate?.toString() || '',
      initialStock: (product.inventory?.[0]?.quantity ?? 0).toString(),
      returnDays: (product.returnDays ?? 7).toString(),
    });
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">المنتجات</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-brand flex items-center gap-2"
        >
          <Plus size={18} /> إضافة منتج
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input ps-9" placeholder="بحث بالاسم أو الباركود..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button
            type="button"
            onClick={() => setShowSearchScanner(true)}
            className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors flex-shrink-0"
            title="مسح باركود للبحث"
          >
            <ScanLine size={18} />
          </button>
        </div>
        <select className="input w-auto" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
          <option value="">كل الفئات</option>
          {categories.map((category: any) => (
            <option key={category.id} value={category.id}>
              {category.nameAr || category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">المنتج</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">الباركود</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">السعر</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">المخزون</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">الفئة</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                products.map((product: any) => {
                  const stock = product.inventory?.[0]?.quantity ?? 0;
                  const minStock = product.minStock ?? product.inventory?.[0]?.minStock ?? 5;
                  const lowStock = stock <= minStock;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-500">
                            <Package size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{product.nameAr || product.name}</p>
                            <p className="text-xs text-gray-400">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-gray-500">{product.barcode || '—'}</td>
                      <td className="px-4 py-3 font-bold text-brand-500">{formatCurrency(product.price, cur)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', lowStock ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400')}>
                          {lowStock && <AlertTriangle size={11} className="inline me-1" />}
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {product.category && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="w-2 h-2 rounded-full" style={{ background: product.category.color }} />
                            {product.category.nameAr || product.category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => startEdit(product)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-500 transition-colors"><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!loading && products.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد منتجات</p>
            </div>
          )}
        </div>
      </div>

      {showSearchScanner && (
        <BarcodeScanner
          onScan={(code) => { setSearch(code); setShowSearchScanner(false); }}
          onClose={() => setShowSearchScanner(false)}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="font-bold text-gray-900 dark:text-white">{editing ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">الاسم (عربي) *</label>
                  <input className="input" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} placeholder="أدوات منزلية" required />
                </div>
                <div>
                  <label className="label">الاسم (إنجليزي)</label>
                  <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Home Tools" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">سعر البيع *</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" required dir="ltr" />
                </div>
                <div>
                  <label className="label">سعر التكلفة</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} placeholder="0.00" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">الباركود</label>
                  <div className="flex items-start gap-2">
                    <input className="input flex-1" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="1234567890" dir="ltr" />
                    <button type="button" onClick={() => setShowBarcodeScanner((value) => !value)} className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-500 hover:bg-brand-100 transition-colors flex-shrink-0" title="مسح باركود بالكاميرا">
                      <ScanLine size={18} />
                    </button>
                  </div>
                  {showBarcodeScanner && (
                    <div className="mt-3">
                      <BarcodeScanner
                        autoStart
                        variant="inline"
                        onScan={(code) => {
                          setForm((f) => ({ ...f, barcode: code }));
                          setShowBarcodeScanner(false);
                        }}
                        onClose={() => setShowBarcodeScanner(false)}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">الفئة</label>
                  <select
                    className="input"
                    value={form.categoryId === '' ? '' : (categories.some((c:any) => c.id === form.categoryId) ? form.categoryId : 'other')}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, categoryId: e.target.value }));
                      if (e.target.value === 'other') {
                        setShowNewCategoryInput(true);
                      } else {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }
                    }}
                  >
                    <option value="">بدون فئة</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.nameAr || category.name}
                      </option>
                    ))}
                    <option value="other">أخرى...</option>
                  </select>
                  {showNewCategoryInput && (
                    <input
                      className="input mt-2"
                      placeholder="اسم الفئة الجديدة"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required={form.categoryId === 'other'}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">حد التنبيه</label>
                  <input className="input" type="number" min="0" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <label className="label">الضريبة %</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} dir="ltr" />
                </div>
              </div>

              <div>
                <label className="label">سياسة الاسترجاع</label>
                <div className="flex gap-2 mt-1">
                  {[{ v: '7', label: '٧ أيام' }, { v: '14', label: '١٤ يوماً' }, { v: '0', label: 'لا يُسترجع' }].map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, returnDays: v }))}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all',
                        form.returnDays === v
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600'
                          : 'border-gray-100 dark:border-gray-700 text-gray-500',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">{editing ? 'الكمية الحالية' : 'المخزون الأولي'}</label>
                <input className="input" type="number" min="0" value={form.initialStock} onChange={(e) => setForm((f) => ({ ...f, initialStock: e.target.value }))} dir="ltr" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800">إلغاء</button>
                <button type="submit" className="flex-1 btn-brand py-3">{editing ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
