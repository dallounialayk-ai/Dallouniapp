-- ============================================================
-- ميزات لوحة التحكم (Admin)
-- نفّذ في Supabase SQL Editor مرة واحدة
-- ============================================================

alter table public.profiles
  add column if not exists is_approved boolean not null default true;

alter table public.profiles
  add column if not exists rating_override numeric(2,1);

alter table public.profiles
  add column if not exists rating_override_note text;

alter table public.profiles
  add column if not exists is_blocked boolean not null default false;

alter table public.reports
  add column if not exists status text not null default 'pending';

alter table public.reports
  add column if not exists admin_note text;

alter table public.reports
  add column if not exists resolved_at timestamptz;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('provider_approval_required', 'false'::jsonb)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_all" on public.app_settings;
create policy "app_settings_select_all"
  on public.app_settings for select using (true);

-- عند إنشاء مستخدم جديد: مقدمو الخدمة يُعلَّقون إذا كان إعداد الموافقة مفعّلاً
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'user');
  v_needs_approval boolean := false;
  v_setting jsonb;
begin
  if v_role = 'provider' then
    select value into v_setting
    from public.app_settings
    where key = 'provider_approval_required';

    if v_setting is not null then
      if jsonb_typeof(v_setting) = 'boolean' then
        v_needs_approval := (v_setting = 'true'::jsonb);
      else
        v_needs_approval := (trim(both '"' from v_setting::text) = 'true');
      end if;
    end if;
  end if;

  insert into public.profiles (
    id, full_name, phone, email, governorate, role,
    bio, service_category, whatsapp_number, is_approved
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'governorate', ''),
    v_role,
    new.raw_user_meta_data->>'bio',
    new.raw_user_meta_data->>'service_category',
    new.raw_user_meta_data->>'whatsapp_number',
    case when v_role = 'provider' and v_needs_approval then false else true end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create index if not exists idx_profiles_role_created on public.profiles (role, created_at desc);
create index if not exists idx_profiles_approved on public.profiles (role, is_approved) where role = 'provider';
create index if not exists idx_reports_status on public.reports (status, created_at desc);

-- علامة التوثيق الزرقاء (أدمن / تلقائي حسب الشروط في التطبيق)
alter table public.profiles
  add column if not exists admin_verified boolean not null default false;

create index if not exists idx_profiles_admin_verified
  on public.profiles (admin_verified)
  where role = 'provider' and admin_verified = true;

-- مهلة انتهاء طلب الخدمة
alter table public.service_requests
  add column if not exists deadline_days integer;

alter table public.service_requests
  add column if not exists expires_at timestamptz;

create index if not exists idx_service_requests_open_expires
  on public.service_requests (expires_at asc)
  where status = 'open';

-- ملاحظة: نفّذ أيضاً إن لم تكن موجودة:
-- download/create-notification-rpc-v2.sql
-- download/expire-due-requests.sql
