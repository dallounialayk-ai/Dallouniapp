-- مهلة انتهاء طلب الخدمة
-- نفّذ في Supabase SQL Editor

alter table public.service_requests
  add column if not exists deadline_days integer;

alter table public.service_requests
  add column if not exists expires_at timestamptz;

comment on column public.service_requests.deadline_days is
  'مدة المهلة بالأيام عند إنشاء الطلب (1–30)';

comment on column public.service_requests.expires_at is
  'وقت الإغلاق الإجباري للطلب';

create index if not exists idx_service_requests_open_expires
  on public.service_requests (expires_at asc)
  where status = 'open';
