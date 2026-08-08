-- ============================================================
-- علامة التوثيق الزرقاء لمقدمي الخدمة
-- نفّذ في Supabase SQL Editor
-- ============================================================

alter table public.profiles
  add column if not exists admin_verified boolean not null default false;

comment on column public.profiles.admin_verified is
  'تفعيل التوثيق يدوياً من الأدمن (يظهر حتى لو تجاوزت البلاغات الحد، بعد مراجعة الأدمن)';

create index if not exists idx_profiles_admin_verified
  on public.profiles (admin_verified)
  where role = 'provider' and admin_verified = true;
