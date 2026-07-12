-- ============================================================
-- إصلاح نهائي لسياسة RLS لجدول notifications (v4)
-- انسخ هذا بالكامل والصقه في Supabase SQL Editor ثم اضغط Run
-- ============================================================

-- 1. حذف السياسة القديمة التي تمنع إرسال إشعارات لمستخدمين آخرين
DROP POLICY IF EXISTS "notifications_insert_self" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_any_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;

-- 2. إنشاء سياسة جديدة تسمح لأي مستخدم مصدّق بإرسال إشعارات لأي مستخدم
CREATE POLICY "notifications_insert_authenticated" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. عرض جميع السياسات للتأكد
SELECT policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;
