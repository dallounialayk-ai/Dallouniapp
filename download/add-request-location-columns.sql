-- ============================================================
-- إضافة موقع طلب الخدمة (إحداثيات + عنوان مقروء)
-- يُطبّق في: Supabase SQL Editor (مرة واحدة فقط)
-- ============================================================

alter table public.service_requests
  add column if not exists latitude double precision;

alter table public.service_requests
  add column if not exists longitude double precision;

alter table public.service_requests
  add column if not exists location_label text;

create index if not exists idx_service_requests_location
  on public.service_requests (latitude, longitude)
  where latitude is not null and longitude is not null;

select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'service_requests'
  and column_name in ('latitude', 'longitude', 'location_label');
