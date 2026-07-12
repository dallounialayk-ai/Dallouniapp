-- ============================================================
-- إصلاح نهائي v5 - إعادة بناء كاملة لسياسات notifications
-- انسخ هذا بالكامل والصقه في Supabase SQL Editor ثم اضغط Run
-- ============================================================

-- 1. حذف ALL السياسات على notifications (إعادة بناء من الصفر)
DROP POLICY IF EXISTS "notifications_select_self" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_self" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_self" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_any_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;

-- 2. إعادة إنشاء السياسات الثلاث

-- السياسة 1: SELECT - كل مستخدم يرى إشعاراته فقط
CREATE POLICY "notifications_select_self" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- السياسة 2: UPDATE - كل مستخدم يعدّل إشعاراته فقط
CREATE POLICY "notifications_update_self" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- السياسة 3: INSERT - أي مستخدم مصدّق يمكنه إرسال إشعارات لأي مستخدم
CREATE POLICY "notifications_insert_auth" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. التحقق من السياسات (يجب أن ترى 3 سياسات فقط)
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;
