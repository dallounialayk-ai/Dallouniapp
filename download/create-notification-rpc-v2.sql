-- ============================================================
-- الحل النهائي لدوال RPC لإنشاء الإشعارات (v2)
-- انسخ هذا بالكامل والصقه في Supabase SQL Editor ثم اضغط Run
-- ============================================================

-- 1. حذف الدوال القديمة إن وجدت
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.create_notifications_batch(UUID[], TEXT, TEXT, TEXT, JSONB);

-- 2. إنشاء دالة لإنشاء إشعار واحد
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data);
END;
$$;

-- 3. إنشاء دالة لإنشاء عدة إشعارات دفعة واحدة
CREATE OR REPLACE FUNCTION public.create_notifications_batch(
  p_user_ids UUID[],
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT unnest(p_user_ids), p_type, p_title, p_body, p_data;
END;
$$;

-- 4. منح صلاحية تنفيذ الدوال لجميع المستخدمين المصدقين
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notifications_batch(UUID[], TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- 5. التحقق من إنشاء الدوال (استخدام العمود الصحيح prosecdef)
SELECT proname, prokind, prosecdef
FROM pg_proc
WHERE proname IN ('create_notification', 'create_notifications_batch')
AND pronamespace = 'public'::regnamespace;
