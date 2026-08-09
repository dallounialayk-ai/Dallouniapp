-- طلبات حذف الحساب (لصفحة /delete-account ومتطلبات Google Play)
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  phone text not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_account_deletion_requests_status
  on public.account_deletion_requests (status, created_at desc);

alter table public.account_deletion_requests enable row level security;

-- الإدخال عبر service role من الـ API فقط؛ لا نفتح إدراجاً عاماً من المتصفح
