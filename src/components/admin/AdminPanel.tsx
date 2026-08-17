'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Briefcase, ClipboardList, Bell, Flag, Settings,
  LogOut, Download, Search, Check, X, Star, Loader2, RefreshCw, BadgeCheck, Trash2,
} from 'lucide-react';
import { APP_NAME, YEMEN_GOVERNORATES, getCategoryName, getCategoryPath, getDeadlineLabel } from '@/lib/constants';
import { formatDeadlineRemaining } from '@/lib/utils';
import { ServiceCategoryPicker } from '@/components/shared/ServiceCategoryPicker';
import {
  VERIFIED_MAX_REPORTS,
  VERIFIED_MIN_HIGH_REVIEWS,
  VERIFIED_MIN_OFFERS,
} from '@/lib/verification';
import { toast } from 'sonner';

type Tab = 'dashboard' | 'users' | 'providers' | 'requests' | 'notifications' | 'reports' | 'settings';

type Stats = {
  totals: Record<string, number>;
  activity: Record<string, number>;
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string | null;
  governorate: string;
  role: 'user' | 'provider';
  service_category: string | null;
  bio: string | null;
  is_approved?: boolean;
  is_blocked?: boolean;
  admin_verified?: boolean;
  rating_override?: number | null;
  rating_override_note?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
};

type RequestRow = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  governorate: string;
  status: 'open' | 'closed' | string;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  created_at: string;
  deadline_days?: number | null;
  expires_at?: string | null;
  offers_count?: number;
  profile?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    whatsapp_number: string | null;
    governorate: string;
    role: string;
  } | null;
};

type ReportRow = {
  id: string;
  reason: string;
  comment: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  reporter?: { id: string; full_name: string; email: string; role: string } | null;
  reported?: { id: string; full_name: string; email: string; role: string } | null;
};

const NAV: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'الإحصائيات', icon: LayoutDashboard },
  { id: 'users', label: 'المستخدمون', icon: Users },
  { id: 'providers', label: 'أصحاب المهن', icon: Briefcase },
  { id: 'requests', label: 'طلبات الخدمة', icon: ClipboardList },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'reports', label: 'البلاغات', icon: Flag },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  };

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الإحصائيات');
      setStats(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل جلب الإحصائيات');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') void loadStats();
  }, [tab, loadStats]);

  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden">
      <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-l border-border/60 bg-white/80 backdrop-blur">
        <div className="px-4 py-4 flex items-center gap-3 border-b border-border/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="w-9 h-9 object-contain" />
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">{APP_NAME}</div>
            <div className="text-[10px] text-muted-foreground">لوحة التحكم</div>
          </div>
        </div>
        <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'hover:bg-muted text-foreground/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="hidden md:block p-3 mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-border text-sm text-destructive hover:bg-destructive/5"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/50 px-4 md:px-6 py-3 flex items-center justify-between">
          <h1 className="font-bold text-base md:text-lg">
            {NAV.find((n) => n.id === tab)?.label}
          </h1>
          <div className="flex items-center gap-2">
            {tab === 'dashboard' && (
              <button
                onClick={loadStats}
                className="h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted"
                title="تحديث"
              >
                <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={logout}
              className="md:hidden h-9 px-3 rounded-xl border border-border text-xs text-destructive"
            >
              خروج
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {tab === 'dashboard' && <DashboardView stats={stats} loading={statsLoading} />}
          {tab === 'users' && <UsersView role="user" />}
          {tab === 'providers' && <UsersView role="provider" />}
          {tab === 'requests' && <RequestsView />}
          {tab === 'notifications' && <NotificationsView />}
          {tab === 'reports' && <ReportsView />}
          {tab === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1 tracking-tight">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function DashboardView({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        جاري تحميل الإحصائيات…
      </div>
    );
  }
  if (!stats) {
    return <div className="text-sm text-muted-foreground">لا توجد بيانات بعد. تأكد من تنفيذ SQL الأدمن ومفتاح الخدمة.</div>;
  }
  const t = stats.totals;
  const a = stats.activity;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="المستخدمون العاديون" value={t.users ?? 0} />
        <StatCard label="أصحاب المهن" value={t.providers ?? 0} />
        <StatCard label="بانتظار الموافقة" value={t.pendingProviders ?? 0} />
        <StatCard label="حسابات محظورة" value={t.blocked ?? 0} />
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="طلبات الخدمة" value={t.requests ?? 0} hint={`${t.openRequests ?? 0} مفتوحة`} />
        <StatCard label="العروض" value={t.offers ?? 0} />
        <StatCard label="الرسائل" value={t.messages ?? 0} />
        <StatCard label="متوسط التقييم" value={t.avgRating ?? 0} hint={`${t.reviews ?? 0} تقييم`} />
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="بلاغات معلّقة" value={t.reportsPending ?? 0} hint={`إجمالي ${t.reportsTotal ?? 0}`} />
        <StatCard label="مستخدمون جدد (7 أيام)" value={a.newUsers7 ?? 0} />
        <StatCard label="مهن جديدة (7 أيام)" value={a.newProviders7 ?? 0} />
        <StatCard
          label="متوسط النشاط اليومي"
          value={a.avgDailyMessages7 ?? 0}
          hint={`${a.avgDailyRequests30 ?? 0} طلب/يوم (30 يوماً)`}
        />
      </section>
    </div>
  );
}

function UsersView({ role }: { role: 'user' | 'provider' }) {
  const [items, setItems] = useState<ProfileRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [category, setCategory] = useState('');
  const [approved, setApproved] = useState('all');
  const [sort, setSort] = useState('created_at');
  const [dir, setDir] = useState<'desc' | 'asc'>('desc');
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [ratingValue, setRatingValue] = useState('5');
  const [ratingNote, setRatingNote] = useState('');
  const [verification, setVerification] = useState<{
    verified: boolean;
    source: string;
    autoEligible: boolean;
    stats: { offersCount: number; highReviewsCount: number; reportsCount: number };
  } | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams({
      role,
      page: String(page),
      limit: '25',
      sort,
      dir,
    });
    if (q) p.set('q', q);
    if (governorate) p.set('governorate', governorate);
    if (category) p.set('category', category);
    if (approved !== 'all') p.set('approved', approved);
    return p.toString();
  }, [role, page, sort, dir, q, governorate, category, approved]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?${queryString}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الجلب');
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل الجلب');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [role, q, governorate, category, approved, sort, dir]);

  useEffect(() => {
    if (!selected || role !== 'provider') {
      setVerification(null);
      return;
    }
    let cancelled = false;
    setVerificationLoading(true);
    void fetch(`/api/admin/verification?id=${selected.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل جلب التوثيق');
        if (!cancelled) setVerification(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setVerification(null);
          toast.error(e instanceof Error ? e.message : 'فشل جلب التوثيق');
        }
      })
      .finally(() => {
        if (!cancelled) setVerificationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, role]);

  const exportUrl = (format: 'csv' | 'excel') => {
    const p = new URLSearchParams({ role, format });
    if (q) p.set('q', q);
    if (governorate) p.set('governorate', governorate);
    if (category) p.set('category', category);
    if (approved !== 'all') p.set('approved', approved);
    return `/api/admin/export?${p.toString()}`;
  };

  const patchUser = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل التحديث');
    toast.success('تم التحديث');
    await load();
    if (selected?.id === id) setSelected(data.item);
  };

  const columns = role === 'provider'
    ? ['الاسم', 'البريد', 'الهاتف', 'المحافظة', 'التخصص', 'الموافقة', 'التسجيل']
    : ['الاسم', 'البريد', 'الهاتف', 'واتساب', 'المحافظة', 'التسجيل'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم / البريد / الهاتف"
            className="w-full h-10 rounded-xl border border-border bg-white pr-9 pl-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={exportUrl('csv')}
            className="h-10 px-3 rounded-xl border border-border bg-white text-sm inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> CSV
          </a>
          <a
            href={exportUrl('excel')}
            className="h-10 px-3 rounded-xl border border-border bg-white text-sm inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Excel
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="المحافظة"
          value={governorate}
          onChange={setGovernorate}
          options={[{ value: '', label: 'الكل' }, ...YEMEN_GOVERNORATES.map((g) => ({ value: g, label: g }))]}
        />
        {role === 'provider' && (
          <>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-white border border-border rounded-xl px-2 h-10 min-w-[220px]">
              <span className="whitespace-nowrap">التخصص</span>
              <div className="flex-1 min-w-0">
                <ServiceCategoryPicker
                  value={category || 'all'}
                  onChange={(v) => setCategory(v === 'all' ? '' : v)}
                  mode="filter"
                  allowAll
                  placeholder="الكل"
                  triggerClassName="w-full h-8 border-0 bg-transparent px-1 text-sm text-right flex items-center justify-between gap-1"
                />
              </div>
            </div>
            <FilterSelect
              label="الموافقة"
              value={approved}
              onChange={setApproved}
              options={[
                { value: 'all', label: 'الكل' },
                { value: 'true', label: 'مفعّل' },
                { value: 'false', label: 'بانتظار' },
              ]}
            />
          </>
        )}
        <FilterSelect
          label="ترتيب"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'created_at', label: 'تاريخ التسجيل' },
            { value: 'full_name', label: 'الاسم' },
            { value: 'email', label: 'البريد' },
            { value: 'governorate', label: 'المحافظة' },
            ...(role === 'provider' ? [{ value: 'service_category', label: 'التخصص' }] : []),
          ]}
        />
        <FilterSelect
          label="الاتجاه"
          value={dir}
          onChange={(v) => setDir(v as 'asc' | 'desc')}
          options={[
            { value: 'desc', label: 'تنازلي' },
            { value: 'asc', label: 'تصاعدي' },
          ]}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="text-right font-medium px-3 py-2.5 whitespace-nowrap">
                    {c}
                  </th>
                ))}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-3 py-10 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin inline-block ml-2" />
                    جاري التحميل…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-3 py-10 text-center text-muted-foreground">
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-medium">
                      <span className="inline-flex items-center gap-1">
                        {u.full_name}
                        {role === 'provider' && u.admin_verified ? (
                          <BadgeCheck className="w-3.5 h-3.5 text-[#1D9BF0]" />
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{u.email}</td>
                    <td className="px-3 py-2.5 dir-ltr text-right">{u.phone}</td>
                    {role === 'user' ? (
                      <td className="px-3 py-2.5 dir-ltr text-right">{u.whatsapp_number || '—'}</td>
                    ) : null}
                    <td className="px-3 py-2.5">{u.governorate}</td>
                    {role === 'provider' ? (
                      <>
                        <td className="px-3 py-2.5">{getCategoryPath(u.service_category || '')}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full ${
                              u.is_approved !== false
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {u.is_approved !== false ? 'مفعّل' : 'بانتظار'}
                          </span>
                        </td>
                      </>
                    ) : null}
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('ar-YE')}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => {
                          setSelected(u);
                          setRatingValue(String(u.rating_override ?? 5));
                          setRatingNote(u.rating_override_note ?? '');
                        }}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        إدارة
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 text-xs text-muted-foreground">
          <span>
            {total} نتيجة — صفحة {page}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded-lg border disabled:opacity-40"
            >
              السابق
            </button>
            <button
              disabled={page * 25 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 rounded-lg border disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg">{selected.full_name}</h3>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Info label="الهاتف" value={selected.phone} />
              <Info label="واتساب" value={selected.whatsapp_number || '—'} />
              <Info label="المحافظة" value={selected.governorate} />
              <Info
                label="التخصص"
                value={selected.service_category ? getCategoryPath(selected.service_category) : '—'}
              />
              <Info
                label="الموقع"
                value={
                  selected.latitude != null
                    ? `${selected.latitude.toFixed(4)}, ${selected.longitude?.toFixed(4)}`
                    : '—'
                }
              />
              <Info label="التسجيل" value={new Date(selected.created_at).toLocaleString('ar-YE')} />
            </div>
            {selected.bio && (
              <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-3">{selected.bio}</p>
            )}

            {role === 'provider' && (
              <div className="flex flex-wrap gap-2">
                {selected.is_approved === false ? (
                  <button
                    onClick={() => void patchUser(selected.id, { is_approved: true })}
                    className="h-10 px-3 rounded-xl bg-primary text-primary-foreground text-sm inline-flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> موافقة وتفعيل
                  </button>
                ) : (
                  <button
                    onClick={() => void patchUser(selected.id, { is_approved: false })}
                    className="h-10 px-3 rounded-xl border text-sm"
                  >
                    إيقاف الموافقة
                  </button>
                )}
              </div>
            )}

            {role === 'provider' && (
              <div className="rounded-2xl border border-border/60 p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BadgeCheck className="w-4 h-4 text-[#1D9BF0]" />
                  علامة التوثيق الزرقاء
                </div>
                {verificationLoading ? (
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري التحقق من الشروط…
                  </div>
                ) : verification ? (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      الحالة:{' '}
                      <span className="font-semibold text-foreground">
                        {verification.verified
                          ? verification.source === 'admin'
                            ? 'موثّق (من الأدمن)'
                            : 'موثّق (تلقائي)'
                          : 'غير موثّق'}
                      </span>
                    </p>
                    <ul className="space-y-1 list-disc pr-4">
                      <li>
                        عروض السعر: {verification.stats.offersCount} / مطلوب أكثر من{' '}
                        {VERIFIED_MIN_OFFERS}
                      </li>
                      <li>
                        تقييمات فوق 4 نجوم: {verification.stats.highReviewsCount} / مطلوب أكثر من{' '}
                        {VERIFIED_MIN_HIGH_REVIEWS}
                      </li>
                      <li>
                        البلاغات: {verification.stats.reportsCount} / الحد الأقصى{' '}
                        {VERIFIED_MAX_REPORTS} (عند التجاوز تختفي العلامة التلقائية)
                      </li>
                    </ul>
                    {verification.stats.reportsCount > VERIFIED_MAX_REPORTS && (
                      <p className="text-amber-700 bg-amber-50 rounded-lg p-2">
                        تجاوز البلاغات الحد. راجع البلاغات ثم فعّل التوثيق يدوياً إن لزم، أو انتظر
                        استيفاء الشروط من جديد بعد انخفاض البلاغات.
                      </p>
                    )}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {selected.admin_verified ? (
                    <button
                      onClick={() => void patchUser(selected.id, { admin_verified: false })}
                      className="h-10 px-3 rounded-xl border text-sm"
                    >
                      إلغاء توثيق الأدمن
                    </button>
                  ) : (
                    <button
                      onClick={() => void patchUser(selected.id, { admin_verified: true })}
                      className="h-10 px-3 rounded-xl bg-[#1D9BF0] text-white text-sm inline-flex items-center gap-1"
                    >
                      <BadgeCheck className="w-4 h-4" /> تفعيل التوثيق
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {selected.is_blocked ? (
                <button
                  onClick={() => void patchUser(selected.id, { is_blocked: false })}
                  className="h-10 px-3 rounded-xl border text-sm"
                >
                  إلغاء الحظر
                </button>
              ) : (
                <button
                  onClick={() => void patchUser(selected.id, { is_blocked: true })}
                  className="h-10 px-3 rounded-xl border border-destructive/30 text-destructive text-sm"
                >
                  حظر الحساب
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Star className="w-4 h-4 text-amber-500" />
                رفع / ضبط التقييم من الأدمن
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={ratingValue}
                  onChange={(e) => setRatingValue(e.target.value)}
                  className="w-24 h-10 rounded-xl border px-2 text-sm"
                />
                <input
                  value={ratingNote}
                  onChange={(e) => setRatingNote(e.target.value)}
                  placeholder="ملاحظة اختيارية"
                  className="flex-1 h-10 rounded-xl border px-3 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    void patchUser(selected.id, {
                      rating_override: Number(ratingValue),
                      rating_override_note: ratingNote,
                    })
                  }
                  className="h-10 px-3 rounded-xl bg-primary text-primary-foreground text-sm"
                >
                  حفظ التقييم
                </button>
                <button
                  onClick={() => void patchUser(selected.id, { rating_override: null })}
                  className="h-10 px-3 rounded-xl border text-sm"
                >
                  إزالة التعديل
                </button>
              </div>
              {selected.rating_override != null && (
                <p className="text-xs text-muted-foreground">
                  التقييم الحالي من الأدمن: {selected.rating_override}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-white border border-border rounded-xl px-2 h-10">
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm text-foreground bg-transparent outline-none max-w-[140px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-medium mt-0.5 break-all">{value}</div>
    </div>
  );
}

function RequestsView() {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [governorate, setGovernorate] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<RequestRow | null>(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams({
      page: String(page),
      limit: '25',
      status,
    });
    if (q) p.set('q', q);
    if (governorate) p.set('governorate', governorate);
    if (category) p.set('category', category);
    return p.toString();
  }, [page, status, q, governorate, category]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests?${queryString}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الطلبات');
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, status, governorate, category]);

  const deleteRequest = async (row: RequestRow) => {
    const ok = window.confirm(
      `حذف طلب الخدمة «${row.title}»؟\nسيتم حذف العروض المرتبطة به ولا يمكن التراجع.`
    );
    if (!ok) return;
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/requests/${row.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم حذف الطلب');
      if (selected?.id === row.id) setSelected(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالعنوان / الوصف / صاحب الطلب"
            className="w-full h-10 rounded-xl border border-border bg-white pr-9 pl-3 text-sm"
          />
        </div>
        <button
          onClick={() => void load()}
          className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="الحالة"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'الكل' },
            { value: 'open', label: 'مفتوح' },
            { value: 'closed', label: 'مغلق' },
          ]}
        />
        <FilterSelect
          label="المحافظة"
          value={governorate}
          onChange={setGovernorate}
          options={[
            { value: '', label: 'الكل' },
            ...YEMEN_GOVERNORATES.map((g) => ({ value: g, label: g })),
          ]}
        />
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-white border border-border rounded-xl px-2 h-10 min-w-[220px]">
          <span className="whitespace-nowrap">التخصص</span>
          <div className="flex-1 min-w-0">
            <ServiceCategoryPicker
              value={category || 'all'}
              onChange={(v) => setCategory(v === 'all' ? '' : v)}
              mode="filter"
              allowAll
              placeholder="الكل"
              triggerClassName="w-full h-8 border-0 bg-transparent px-1 text-sm text-right flex items-center justify-between gap-1"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                {['الطلب', 'صاحب الطلب', 'التخصص', 'المحافظة', 'الحالة', 'العروض', 'التاريخ', ''].map(
                  (h) => (
                    <th key={h || 'actions'} className="text-right font-medium px-3 py-2.5">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin inline-block ml-2" />
                    جاري التحميل…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">
                    لا توجد طلبات خدمة
                  </td>
                </tr>
              ) : (
                items.map((r) => {
                  const deadline = formatDeadlineRemaining(r.expires_at);
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-border/40 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-medium line-clamp-1">{r.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {r.description}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{r.profile?.full_name || '—'}</div>
                        <div className="text-[11px] text-muted-foreground" dir="ltr">
                          {r.profile?.phone || r.profile?.email || ''}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {getCategoryPath(r.category) || getCategoryName(r.category) || r.category}
                      </td>
                      <td className="px-3 py-2.5">{r.governorate}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            r.status === 'open'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {r.status === 'open' ? 'مفتوح' : 'مغلق'}
                        </span>
                        {deadline && (
                          <div
                            className={`text-[10px] mt-1 ${
                              deadline.expired || deadline.urgent
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {deadline.text}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">{r.offers_count ?? 0}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString('ar-YE')}
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled={deletingId === r.id}
                          onClick={() => void deleteRequest(r)}
                          className="h-9 px-3 rounded-xl border border-destructive/30 text-destructive text-xs inline-flex items-center gap-1 hover:bg-destructive/5 disabled:opacity-50"
                        >
                          {deletingId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 text-xs text-muted-foreground">
          <span>
            {total} نتيجة — صفحة {page}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded-lg border disabled:opacity-40"
            >
              السابق
            </button>
            <button
              disabled={page * 25 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 rounded-lg border disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg">{selected.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selected.status === 'open' ? 'طلب مفتوح' : 'طلب مغلق'}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm leading-relaxed bg-muted/40 rounded-xl p-3 whitespace-pre-wrap">
              {selected.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Info
                label="التخصص"
                value={
                  getCategoryPath(selected.category) ||
                  getCategoryName(selected.category) ||
                  selected.category
                }
              />
              <Info label="المحافظة" value={selected.governorate} />
              <Info label="صاحب الطلب" value={selected.profile?.full_name || '—'} />
              <Info label="الهاتف" value={selected.profile?.phone || '—'} />
              <Info label="البريد" value={selected.profile?.email || '—'} />
              <Info label="واتساب" value={selected.profile?.whatsapp_number || '—'} />
              <Info label="الموقع" value={selected.location_label || '—'} />
              <Info
                label="الإحداثيات"
                value={
                  selected.latitude != null
                    ? `${selected.latitude.toFixed(5)}, ${selected.longitude?.toFixed(5) ?? '—'}`
                    : '—'
                }
              />
              <Info
                label="مهلة الطلب"
                value={getDeadlineLabel(selected.deadline_days) || '—'}
              />
              <Info
                label="ينتهي في"
                value={
                  selected.expires_at
                    ? new Date(selected.expires_at).toLocaleString('ar-YE')
                    : '—'
                }
              />
              <Info label="عدد العروض" value={String(selected.offers_count ?? 0)} />
              <Info
                label="تاريخ الإنشاء"
                value={new Date(selected.created_at).toLocaleString('ar-YE')}
              />
            </div>

            <button
              disabled={deletingId === selected.id}
              onClick={() => void deleteRequest(selected)}
              className="w-full h-11 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-destructive/5 disabled:opacity-50"
            >
              {deletingId === selected.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              حذف الطلب
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsView() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all' | 'user' | 'provider'>('all');
  const [sending, setSending] = useState(false);
  const [recent, setRecent] = useState<
    { id: string; title: string; body: string; created_at: string; user_id: string }[]
  >([]);

  const loadRecent = useCallback(async () => {
    const res = await fetch('/api/admin/notifications');
    const data = await res.json();
    if (res.ok) setRecent(data.items ?? []);
  }, []);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  const send = async () => {
    if (!title.trim()) {
      toast.error('أدخل عنوان الإشعار');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال');
      toast.success(`تم إرسال ${data.sent} إشعاراً`);
      setTitle('');
      setBody('');
      await loadRecent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-border/60 bg-white p-4 space-y-3">
        <h3 className="font-semibold">إرسال إشعار داخلي</h3>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">الجمهور</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
            className="w-full h-10 rounded-xl border px-3 text-sm"
          >
            <option value="all">الجميع</option>
            <option value="user">المستخدمون العاديون</option>
            <option value="provider">أصحاب المهن</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">العنوان</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 rounded-xl border px-3 text-sm"
            placeholder="عنوان الإشعار"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">النص</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full min-h-28 rounded-xl border px-3 py-2 text-sm"
            placeholder="محتوى الإشعار"
          />
        </div>
        <button
          onClick={send}
          disabled={sending}
          className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          إرسال
        </button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-4">
        <h3 className="font-semibold mb-3">آخر الإشعارات الإدارية</h3>
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد إشعارات إدارية بعد</p>
          ) : (
            recent.map((n) => (
              <div key={n.id} className="rounded-xl border border-border/50 p-3">
                <div className="font-medium text-sm">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.body}</div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  {new Date(n.created_at).toLocaleString('ar-YE')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ReportsView() {
  const [items, setItems] = useState<ReportRow[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الجلب');
      setItems(data.items ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل الجلب');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, next: string) => {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'فشل التحديث');
      return;
    }
    toast.success('تم تحديث البلاغ');
    await load();
  };

  return (
    <div className="space-y-4">
      <FilterSelect
        label="الحالة"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'pending', label: 'معلّق' },
          { value: 'reviewed', label: 'قيد المراجعة' },
          { value: 'resolved', label: 'محلول' },
          { value: 'dismissed', label: 'مرفوض' },
          { value: 'all', label: 'الكل' },
        ]}
      />

      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin inline-block ml-2" />
            جاري التحميل…
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">لا توجد بلاغات</div>
        ) : (
          items.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/60 bg-white p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm">{r.reason}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    من: {r.reporter?.full_name || r.reporter?.email || '—'} → على:{' '}
                    {r.reported?.full_name || r.reported?.email || '—'}
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted">{r.status}</span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              <div className="text-[10px] text-muted-foreground">
                {new Date(r.created_at).toLocaleString('ar-YE')}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => void updateStatus(r.id, 'reviewed')}
                  className="h-9 px-3 rounded-xl border text-xs"
                >
                  مراجعة
                </button>
                <button
                  onClick={() => void updateStatus(r.id, 'resolved')}
                  className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs"
                >
                  حلّ البلاغ
                </button>
                <button
                  onClick={() => void updateStatus(r.id, 'dismissed')}
                  className="h-9 px-3 rounded-xl border text-xs text-destructive"
                >
                  رفض
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SettingsView() {
  const [required, setRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل الجلب');
        setRequired(Boolean(data.provider_approval_required));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'فشل جلب الإعدادات');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (value: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_approval_required: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      setRequired(value);
      toast.success(value ? 'تم تفعيل موافقة الأدمن' : 'تم إيقاف موافقة الأدمن');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin inline-block ml-2" />
        جاري التحميل…
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl border border-border/60 bg-white p-5 space-y-3">
        <h3 className="font-semibold">موافقة تسجيل أصحاب المهن</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          عند التفعيل: حسابات مقدمي الخدمة الجديدة تبقى بانتظار موافقتك قبل استخدام التطبيق.
          عند الإيقاف: يمكنهم التسجيل والدخول مباشرة بدون موافقة.
        </p>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
          <div className="text-sm font-medium">
            {required ? 'الموافقة مطلوبة حالياً' : 'التسجيل مفتوح بدون موافقة'}
          </div>
          <button
            disabled={saving}
            onClick={() => void save(!required)}
            className={`relative h-8 w-14 rounded-full transition-colors ${
              required ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                required ? 'left-1' : 'right-1'
              }`}
            />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          نفّذ ملف <code className="bg-muted px-1 rounded">download/admin-features.sql</code> في
          Supabase قبل استخدام هذه الميزة.
        </p>
      </div>
    </div>
  );
}
