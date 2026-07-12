-- ============================================================
-- إصلاح نهائي لسياسة RLS لجدول notifications
-- انسخ والصق هذا بالكامل في Supabase SQL Editor ثم اضغط Run
-- ============================================================

-- الخطوة 1: حذف السياسة القديمة التي تمنع إرسال إشعارات لمستخدمين آخرين
DROP POLICY IF EXISTS "notifications_insert_self" ON public.notifications;

-- الخطوة 2: إنشاء سياسة جديدة تسمح لأي مستخدم مصدّق بإرسال إشعارات لأي مستخدم
CREATE POLICY "notifications_insert_authenticated" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- الخطوة 3: التحقق من السياسات (يجب أن ترى 3 سياسات: SELECT, UPDATE, INSERT)
SELECT policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;
