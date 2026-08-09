'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function DeleteAccountPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'فشل إرسال الطلب');
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-dvh w-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto max-w-lg px-5 py-8 pb-16 space-y-6">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{APP_NAME}</p>
          <h1 className="text-2xl font-bold tracking-tight">طلب حذف الحساب</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            استخدم هذه الصفحة لطلب حذف حسابك وجميع البيانات المرتبطة به من تطبيق {APP_NAME}.
          </p>
        </div>

        <section className="rounded-2xl border border-border/60 bg-card p-4 space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground">ما الذي سيتم حذفه؟</p>
          <ul className="list-disc pr-5 space-y-1">
            <li>بيانات الحساب والملف الشخصي</li>
            <li>الطلبات والعروض والرسائل المرتبطة بحسابك قدر الإمكان</li>
            <li>الصور المرفوعة ضمن الملف الشخصي/المعرض</li>
          </ul>
          <p>
            نهدف لإنهاء الطلب خلال <span className="font-semibold text-foreground">7 أيام</span> كحد
            أقصى من تاريخ الاستلام (وقد نحتفظ ببعض السجلات للامتثال القانوني عند اللزوم).
          </p>
        </section>

        {done ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 p-4 text-sm leading-relaxed">
            تم استلام طلبك بنجاح. سنراجع الطلب ونحذف الحساب والبيانات المرتبطة خلال المهلة المذكورة.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">الاسم</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm"
                placeholder="اسمك كما في الحساب"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">رقم الهاتف *</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm"
                placeholder="07xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">ملاحظة (اختياري)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none"
                placeholder="سبب الحذف أو أي تفاصيل إضافية"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-destructive text-white font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              إرسال طلب الحذف
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/privacy" className="text-sm text-primary font-medium">
            سياسة الخصوصية
          </Link>
          <Link href="/" className="text-sm text-muted-foreground">
            العودة للتطبيق
          </Link>
        </div>
      </div>
    </main>
  );
}
