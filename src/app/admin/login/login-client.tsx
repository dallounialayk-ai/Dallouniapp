'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function AdminLoginClient() {
  const search = useSearchParams();
  const next = search.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول');
        setLoading(false);
        return;
      }
      // انتقال كامل لضمان إرسال كوكي الجلسة مع أول طلب لـ /admin
      window.location.assign(next.startsWith('/') ? next : '/admin');
    } catch {
      setError('تعذّر الاتصال بالخادم');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-gradient-to-b from-background via-background to-primary/[0.06] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="w-16 h-16 mx-auto object-contain" />
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              لوحة التحكم
            </div>
            <h1 className="text-2xl font-bold mt-3">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground mt-1">دخول المسؤول فقط</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_12px_40px_-16px_rgba(32,99,155,0.25)] space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="admin@example.com"
              autoComplete="username"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 pl-11 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
                autoComplete="current-password"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                title={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            دخول
          </button>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            بيانات الدخول من ملف <span className="font-mono">.env</span> فقط
            (<span className="font-mono">ADMIN_EMAIL</span> / <span className="font-mono">ADMIN_PASSWORD</span>).
            بعد تعديلها أعد تشغيل الخادم.
          </p>
        </form>
      </div>
    </div>
  );
}
