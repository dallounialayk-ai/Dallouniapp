-- ============================================================
-- إصلاح سياسة RLS لجدول notifications (النسخة النهائية)
-- يُطبّق في: Supabase SQL Editor (مرة واحدة فقط)
-- ============================================================

-- 1. حذف جميع سياسات INSERT القديمة على notifications
DROP POLICY IF EXISTS "notifications_insert_self" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_any_authenticated" ON public.notifications;

-- 2. إنشاء سياسة INSERT جديدة
-- تسمح لأي مستخدم مصدّق بإدراج إشعارات لأي مستخدم آخر
CREATE POLICY "notifications_insert_authenticated" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. التحقق من السياسات النهائية
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;
