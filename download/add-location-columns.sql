-- ============================================================
-- إضافة إحداثيات الموقع لجدول profiles
-- يُطبّق في: Supabase SQL Editor (مرة واحدة فقط)
-- ============================================================

alter table public.profiles
  add column if not exists latitude double precision;

alter table public.profiles
  add column if not exists longitude double precision;

create index if not exists idx_profiles_location
  on public.profiles (latitude, longitude)
  where latitude is not null and longitude is not null;

-- التحقق
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'profiles'
  and column_name in ('latitude', 'longitude');
