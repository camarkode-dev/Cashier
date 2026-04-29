'use client';
import { useEffect, useState } from 'react';
import { categoriesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#f97316', '#ef4444', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1',
  '#10b981', '#64748b',
];

const PRESET_ICONS = ['📦', '🖥️', '📱', '🏠', '🔧', '⚡', '❄️', '🍳', '🧹', '💡', '🎮', '🔑'];

const emptyForm = { name: '', nameAr: '', color: '#f97316', icon: '' };

export default function CategoriesPage() {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === 'OWNER' || user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await categoriesApi.list();
      setCategories(Array.isArray(res) ? res : res?.data || []);
    } catch {
      toast.error('تعذر تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditCat(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (cat: any) => {
    setEditCat(cat);
    setForm({ name: cat.name || '', nameAr: cat.nameAr || '', color: cat.color || '#f97316', icon: cat.icon || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim() && !form.name.trim()) {
      toast.error('أدخل اسم الفئة');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim() || form.nameAr.trim(),
        nameAr: form.nameAr.trim() || undefined,
        color: form.color || undefined,
        icon: form.icon.trim() || undefined,
      };
      if (editCat) {
        await categoriesApi.update(editCat.id, payload);
      } else {
        await categoriesApi.create(payload);
      }
      toast.success('تم الحفظ');
      setShowForm(false);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'تعذر الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: any) => {
    if (!confirm(`حذف فئة "${cat.nameAr || cat.name}"؟\nسيتم إزالة الفئة من جميع المنتجات المرتبطة بها.`)) return;
    try {
      await categoriesApi.delete(cat.id);
      toast.success('تم الحذف');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'تعذر الحذف — قد تكون الفئة مرتبطة بمنتجات');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">الفئات</h2>
          <p className="text-sm text-gray-400 mt-0.5">تصنيف المنتجات حسب النوع</p>
        </div>
        {canManage && (
          <button onClick={openAdd} className="btn-brand flex items-center gap-2">
            <Plus size={18} /> إضافة فئة
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-brand-500">{categories.length}</p>
          <p className="text-xs text-gray-400 mt-1">إجمالي الفئات</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-green-500">
            {categories.reduce((s, c) => s + (c._count?.products || 0), 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">إجمالي المنتجات</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-blue-500">
            {categories.filter(c => (c._count?.products || 0) > 0).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">فئات نشطة</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-amber-500">
            {categories.filter(c => (c._count?.products || 0) === 0).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">فئات فارغة</p>
        </div>
      </div>

      {/* Categories grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
          <Tag size={48} className="mb-3 opacity-30" />
          <p className="font-medium">لا توجد فئات بعد</p>
          {canManage && (
            <button onClick={openAdd} className="mt-4 btn-brand px-5 py-2 text-sm">
              <Plus size={16} className="inline me-1" /> أضف أول فئة
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="card p-5 flex items-start justify-between hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 text-xl"
                  style={{ background: cat.color || '#f97316' }}
                >
                  {cat.icon || <Tag size={20} className="text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {cat.nameAr || cat.name}
                  </p>
                  {cat.nameAr && cat.name && cat.nameAr !== cat.name && (
                    <p className="text-xs text-gray-400 truncate">{cat.name}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: cat.color || '#f97316' }}
                    />
                    <span className="text-xs text-gray-400">
                      {cat._count?.products || 0} منتج
                    </span>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ms-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950 text-gray-400 hover:text-brand-500 transition-colors"
                    title="تعديل"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {editCat ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0"
                  style={{ background: form.color }}
                >
                  {form.icon || <Tag size={20} className="text-white" />}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {form.nameAr || form.name || 'اسم الفئة'}
                  </p>
                  <p className="text-xs text-gray-400">معاينة الفئة</p>
                </div>
              </div>

              {/* Arabic name */}
              <div>
                <label className="label">اسم الفئة (عربي) <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  placeholder="مثال: أجهزة المطبخ"
                  value={form.nameAr}
                  onChange={(e) => setForm(f => ({ ...f, nameAr: e.target.value }))}
                />
              </div>

              {/* English name */}
              <div>
                <label className="label">اسم الفئة (إنجليزي)</label>
                <input
                  className="input"
                  dir="ltr"
                  placeholder="e.g. Kitchen Appliances"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Color */}
              <div>
                <label className="label">اللون</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={cn(
                        'w-8 h-8 rounded-xl border-2 transition-all',
                        form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent',
                      )}
                      style={{ background: c }}
                    />
                  ))}
                  <label className="w-8 h-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden" title="لون مخصص">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                      className="opacity-0 absolute w-1 h-1"
                    />
                    <span className="text-xs text-gray-400">+</span>
                  </label>
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="label">الأيقونة (emoji)</label>
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                  {PRESET_ICONS.map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon: f.icon === ico ? '' : ico }))}
                      className={cn(
                        'w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all',
                        form.icon === ico
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                          : 'border-gray-100 dark:border-gray-700 hover:border-gray-300',
                      )}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
                <input
                  className="input text-sm"
                  placeholder="أو اكتب emoji مخصص"
                  value={form.icon}
                  onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                  maxLength={4}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-brand py-3 disabled:opacity-60"
                >
                  {submitting ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
