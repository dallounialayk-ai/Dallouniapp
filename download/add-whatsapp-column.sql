-- ============================================================
-- إضافة عمود whatsapp_number لجدول profiles
-- يُطبّق في: Supabase SQL Editor (مرة واحدة فقط)
-- ============================================================

-- 1. إضافة عمود whatsapp_number (نص، اختياري)
alter table public.profiles 
add column if not exists whatsapp_number text;

-- 2. التحقق من الإضافة
select column_name, data_type, is_nullable
from information_schema.columns 
where table_name = 'profiles' 
and column_name = 'whatsapp_number';
