-- ============================================================
-- تفعيل Realtime لجدول messages — مطلوب لتحديث الشات اللحظي
-- يُطبّق في: Supabase SQL Editor (مرة واحدة فقط)
-- ============================================================
-- بعد تطبيق هذا الملف، الرسائل ستظهر فورًا عند الإرسال
-- بدون الحاجة لتحديث الصفحة
-- ============================================================

-- 1. تفعيل Realtime على جدول messages
alter publication supabase_realtime add table public.messages;

-- (اختياري) تفعيل Realtime على باقي الجداول المهمة
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.service_requests;
alter publication supabase_realtime add table public.offers;

-- 2. التحقق من التفعيل (يجب أن ترى أسماء الجداول في النتيجة)
select tablename 
from pg_publication_tables 
where pubname = 'supabase_realtime'
order by tablename;
