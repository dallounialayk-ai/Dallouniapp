'use client';

import { useEffect, useState } from 'react';
import { Database, Copy, Check, AlertTriangle, RefreshCw, ExternalLink, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Status = 'checking' | 'ok' | 'missing';

export function SchemaChecker({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');

  const check = async () => {
    setStatus('checking');
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
        setStatus('missing');
      } else if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        setStatus('missing');
      } else {
        setStatus('ok');
      }
    } catch (e) {
      setStatus('missing');
    }
  };

  useEffect(() => {
    check();
  }, []);

  if (status === 'checking') {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">جاري فحص الاتصال بقاعدة البيانات…</p>
        </div>
      </div>
    );
  }

  if (status === 'ok') return <>{children}</>;

  return <SetupWizard onRetry={check} />;
}

const SQL_SETUP = `-- ============================================================
-- مخطط قاعدة بيانات تطبيق "دلّوني عليك"
-- Dalloony Aleyk Database Schema
-- يُطبّق في: Supabase SQL Editor
-- ============================================================

-- 1. جدول الملفات الشخصية (يتم ربطه بـ auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text not null,
  governorate text not null,
  role text not null check (role in ('user','provider')) default 'user',
  avatar_url text,
  bio text,
  service_category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. طلبات الخدمة
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  title text not null,
  description text not null,
  governorate text not null,
  status text not null check (status in ('open','closed')) default 'open',
  created_at timestamptz not null default now()
);

-- 3. عروض الأسعار
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  price numeric,
  message text not null,
  status text not null check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz not null default now(),
  unique (request_id, provider_id)
);

-- 4. التقييمات
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  review_type text not null check (review_type in ('provider','request')),
  reference_id uuid,
  created_at timestamptz not null default now(),
  unique (reviewer_id, reviewed_id, review_type, reference_id)
);

-- 5. البلاغات
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  comment text,
  created_at timestamptz not null default now()
);

-- 6. الرسائل
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_parties on public.messages (sender_id, receiver_id, created_at);
create index if not exists idx_messages_receiver_unread on public.messages (receiver_id) where read_at is null;

-- 7. كاتلوج الأعمال السابقة
create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  image_url text not null,
  created_at timestamptz not null default now()
);

-- 8. الإشعارات
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user_unread on public.notifications (user_id) where read = false;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.service_requests enable row level security;
alter table public.offers enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.messages enable row level security;
alter table public.catalog_items enable row level security;
alter table public.notifications enable row level security;

-- profiles
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- service_requests
drop policy if exists "requests_select_all" on public.service_requests;
create policy "requests_select_all" on public.service_requests for select using (true);
drop policy if exists "requests_insert_self" on public.service_requests;
create policy "requests_insert_self" on public.service_requests for insert with check (auth.uid() = user_id);
drop policy if exists "requests_update_owner" on public.service_requests;
create policy "requests_update_owner" on public.service_requests for update using (auth.uid() = user_id);
drop policy if exists "requests_delete_owner" on public.service_requests;
create policy "requests_delete_owner" on public.service_requests for delete using (auth.uid() = user_id);

-- offers
drop policy if exists "offers_select_all" on public.offers;
create policy "offers_select_all" on public.offers for select using (true);
drop policy if exists "offers_insert_self" on public.offers;
create policy "offers_insert_self" on public.offers for insert with check (auth.uid() = provider_id);
drop policy if exists "offers_update_self" on public.offers;
create policy "offers_update_self" on public.offers for update using (auth.uid() = provider_id or exists(select 1 from public.service_requests r where r.id = offers.request_id and r.user_id = auth.uid()));
drop policy if exists "offers_delete_self" on public.offers;
create policy "offers_delete_self" on public.offers for delete using (auth.uid() = provider_id);

-- reviews
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);
drop policy if exists "reviews_insert_self" on public.reviews;
create policy "reviews_insert_self" on public.reviews for insert with check (auth.uid() = reviewer_id);
drop policy if exists "reviews_update_self" on public.reviews;
create policy "reviews_update_self" on public.reviews for update using (auth.uid() = reviewer_id);
drop policy if exists "reviews_delete_self" on public.reviews;
create policy "reviews_delete_self" on public.reviews for delete using (auth.uid() = reviewer_id);

-- reports
drop policy if exists "reports_select_self" on public.reports;
create policy "reports_select_self" on public.reports for select using (auth.uid() = reporter_id);
drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self" on public.reports for insert with check (auth.uid() = reporter_id);

-- messages
drop policy if exists "messages_select_parties" on public.messages;
create policy "messages_select_parties" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "messages_insert_parties" on public.messages;
create policy "messages_insert_parties" on public.messages for insert with check (auth.uid() = sender_id);
drop policy if exists "messages_update_parties" on public.messages;
create policy "messages_update_parties" on public.messages for update using (auth.uid() = receiver_id);

-- catalog_items
drop policy if exists "catalog_select_all" on public.catalog_items;
create policy "catalog_select_all" on public.catalog_items for select using (true);
drop policy if exists "catalog_insert_self" on public.catalog_items;
create policy "catalog_insert_self" on public.catalog_items for insert with check (auth.uid() = provider_id);
drop policy if exists "catalog_update_self" on public.catalog_items;
create policy "catalog_update_self" on public.catalog_items for update using (auth.uid() = provider_id);
drop policy if exists "catalog_delete_self" on public.catalog_items;
create policy "catalog_delete_self" on public.catalog_items for delete using (auth.uid() = provider_id);

-- notifications
drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self" on public.notifications for update using (auth.uid() = user_id);

-- ============================================================
-- Trigger: إنشاء profile تلقائيًا عند تسجيل مستخدم جديد
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, governorate, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'governorate', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Storage Buckets لرفع الصور
-- ============================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('catalog', 'catalog', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars' or bucket_id = 'catalog');
drop policy if exists "avatars_auth_insert" on storage.objects;
create policy "avatars_auth_insert" on storage.objects for insert with check ((bucket_id = 'avatars' or bucket_id = 'catalog') and auth.role() = 'authenticated');
drop policy if exists "avatars_auth_update" on storage.objects;
create policy "avatars_auth_update" on storage.objects for update using ((bucket_id = 'avatars' or bucket_id = 'catalog') and auth.role() = 'authenticated');
drop policy if exists "avatars_auth_delete" on storage.objects;
create policy "avatars_auth_delete" on storage.objects for delete using ((bucket_id = 'avatars' or bucket_id = 'catalog') and auth.role() = 'authenticated');`;

function SetupWizard({ onRetry }: { onRetry: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SETUP);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = SQL_SETUP;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-overlay bg-gradient-to-br from-background via-background to-primary/[0.04] flex items-center justify-center p-4 py-6">
      <div className="w-full max-w-2xl">
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">إعداد قاعدة البيانات مطلوب</h1>
              <p className="text-xs text-muted-foreground">خطوة أخيرة قبل بدء استخدام التطبيق</p>
            </div>
          </div>

          {/* Intro */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            تم ربط التطبيق بقاعدة بيانات Supabase الخاصة بك، لكن تحتاج القاعدة إلى إنشاء الجداول.
            العملية تستغرق أقل من دقيقة — اتبع الخطوات التالية:
          </p>

          {/* Steps */}
          <ol className="space-y-3 mb-6">
            <Step
              n={1}
              title="افتح محرر SQL في Supabase"
              description="من لوحة تحكم مشروعك في Supabase، اضغط على SQL Editor في القائمة الجانبية."
              action={
                <a
                  href="https://supabase.com/dashboard/project/mfogdjxvtpvuvxzyyjqn/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary text-xs font-medium hover:underline"
                >
                  فتح المحرر
                  <ExternalLink className="w-3 h-3" />
                </a>
              }
            />
            <Step
              n={2}
              title="انسخ كود SQL أدناه والصقه في المحرر"
              description="اضغط على زر النسخ، ثم الصق في نافذة المحرر."
              action={
                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                    copied ? 'bg-emerald-100 text-emerald-700' : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'تم النسخ' : 'نسخ الكود'}
                </button>
              }
            />
            <Step
              n={3}
              title="اضغط RUN في محرر Supabase"
              description="سيتم إنشاء جميع الجداول وسياسات الأمان والـ triggers اللازمة."
            />
            <Step
              n={4}
              title="عُد إلى التطبيق واضغط «تحقّق الآن»"
              description="سيتحقق التطبيق من نجاح الإعداد وسيبدأ العمل تلقائيًا."
              action={
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <RefreshCw className="w-3 h-3" />
                  تحقّق الآن
                </button>
              }
            />
          </ol>

          {/* SQL preview */}
          <details className="bg-muted/30 rounded-xl border border-border/40">
            <summary className="cursor-pointer p-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              عرض كود SQL الكامل
            </summary>
            <pre className="text-[10px] leading-relaxed p-3 pt-0 overflow-x-auto max-h-72 text-muted-foreground font-mono" dir="ltr">
{SQL_SETUP}
            </pre>
          </details>

          <div className="mt-5 pt-5 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="w-3.5 h-3.5" />
            <span>المشروع: mfogdjxvtpvuvxzyyjqn.supabase.co</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  n, title, description, action,
}: {
  n: number;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
      </div>
    </li>
  );
}
