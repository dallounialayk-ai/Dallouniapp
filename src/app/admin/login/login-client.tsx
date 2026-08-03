'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Shield } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function AdminLoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول');
        setLoading(false);
        return;
      }
      router.replace(next);
      router.refresh();
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
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="••••••••"
              autoComplete="current-password"
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
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
