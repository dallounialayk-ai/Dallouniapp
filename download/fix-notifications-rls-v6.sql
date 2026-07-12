-- ============================================================
-- إصلاح نهائي v6 - حذف ديناميكي لجميع سياسات INSERT
-- هذه النسخة تحذف أي سياسة INSERT موجودة بغض النظر عن اسمها
-- انسخ هذا بالكامل والصقه في Supabase SQL Editor ثم اضغط Run
-- ============================================================

-- 1. حذف ALL سياسات INSERT على notifications ديناميكيًا
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- 2. إنشاء سياسة INSERT جديدة
CREATE POLICY "notifications_insert_auth" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. التحقق من جميع السياسات
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'notifications'
ORDER BY cmd, policyname;
