-- ============================================================
-- إضافة عمود price لجدول catalog_items
-- يُطبّق في: Supabase SQL Editor (مرة واحدة فقط)
-- ============================================================
-- هذا التعديل ضروري لدعم أسعار أصناف مواد البناء
-- الأصناف الأخرى (الأعمال السابقة) ستبقى price = null
-- ============================================================

-- 1. إضافة عمود price (رقمي، اختياري)
alter table public.catalog_items 
add column if not exists price numeric;

-- 2. إضافة عمود unit (وحدة القياس: متر، كيس، طن، إلخ)
alter table public.catalog_items 
add column if not exists unit text;

-- 3. التحقق من الإضافة
select column_name, data_type 
from information_schema.columns 
where table_name = 'catalog_items' 
order by ordinal_position;
