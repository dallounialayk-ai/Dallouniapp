-- ============================================================
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
  latitude double precision,
  longitude double precision,
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
  latitude double precision,
  longitude double precision,
  location_label text,
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

-- profiles: الكل يقدر يقرأ، المستخدم يعدّل بياناته فقط
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- service_requests: الكل يقرأ، المستخدم ينشئ/يعدّل طلباته
drop policy if exists "requests_select_all" on public.service_requests;
create policy "requests_select_all" on public.service_requests for select using (true);

drop policy if exists "requests_insert_self" on public.service_requests;
create policy "requests_insert_self" on public.service_requests for insert with check (auth.uid() = user_id);

drop policy if exists "requests_update_owner" on public.service_requests;
create policy "requests_update_owner" on public.service_requests for update using (auth.uid() = user_id);

drop policy if exists "requests_delete_owner" on public.service_requests;
create policy "requests_delete_owner" on public.service_requests for delete using (auth.uid() = user_id);

-- offers: الكل يقرأ، صاحب الخدمة ينشئ عرضه ويعدّل عرضه، صاحب الطلب يعدّل الحالة
drop policy if exists "offers_select_all" on public.offers;
create policy "offers_select_all" on public.offers for select using (true);

drop policy if exists "offers_insert_self" on public.offers;
create policy "offers_insert_self" on public.offers for insert with check (auth.uid() = provider_id);

drop policy if exists "offers_update_self" on public.offers;
create policy "offers_update_self" on public.offers for update using (auth.uid() = provider_id or exists(select 1 from public.service_requests r where r.id = offers.request_id and r.user_id = auth.uid()));

drop policy if exists "offers_delete_self" on public.offers;
create policy "offers_delete_self" on public.offers for delete using (auth.uid() = provider_id);

-- reviews: الكل يقرأ، المستخدم المسجّل ينشئ، يعدّل/يحذف تقييمه فقط
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);

drop policy if exists "reviews_insert_self" on public.reviews;
create policy "reviews_insert_self" on public.reviews for insert with check (auth.uid() = reviewer_id);

drop policy if exists "reviews_update_self" on public.reviews;
create policy "reviews_update_self" on public.reviews for update using (auth.uid() = reviewer_id);

drop policy if exists "reviews_delete_self" on public.reviews;
create policy "reviews_delete_self" on public.reviews for delete using (auth.uid() = reviewer_id);

-- reports: المستخدم يقرأ بلاغاته وينشئ بلاغاته فقط
drop policy if exists "reports_select_self" on public.reports;
create policy "reports_select_self" on public.reports for select using (auth.uid() = reporter_id);

drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self" on public.reports for insert with check (auth.uid() = reporter_id);

-- messages: المستخدم يقرأ/ينشئ رسائله المرسلة أو المستلمة فقط
drop policy if exists "messages_select_parties" on public.messages;
create policy "messages_select_parties" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "messages_insert_parties" on public.messages;
create policy "messages_insert_parties" on public.messages for insert with check (auth.uid() = sender_id);

drop policy if exists "messages_update_parties" on public.messages;
create policy "messages_update_parties" on public.messages for update using (auth.uid() = receiver_id);

-- catalog_items: الكل يقرأ، صاحب الخدمة ينشئ/يعدّل/يحذف أعماله
drop policy if exists "catalog_select_all" on public.catalog_items;
create policy "catalog_select_all" on public.catalog_items for select using (true);

drop policy if exists "catalog_insert_self" on public.catalog_items;
create policy "catalog_insert_self" on public.catalog_items for insert with check (auth.uid() = provider_id);

drop policy if exists "catalog_update_self" on public.catalog_items;
create policy "catalog_update_self" on public.catalog_items for update using (auth.uid() = provider_id);

drop policy if exists "catalog_delete_self" on public.catalog_items;
create policy "catalog_delete_self" on public.catalog_items for delete using (auth.uid() = provider_id);

-- notifications: المستخدم يقرأ/يعدّل إشعاراته فقط
drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self" on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self" on public.notifications for update using (auth.uid() = user_id);

-- ============================================================
-- Triggers: إنشاء profile تلقائيًا عند تسجيل مستخدم جديد
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
-- إعداد التخزين (Storage Bucket) لرفع الصور
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
create policy "avatars_auth_delete" on storage.objects for delete using ((bucket_id = 'avatars' or bucket_id = 'catalog') and auth.role() = 'authenticated');
