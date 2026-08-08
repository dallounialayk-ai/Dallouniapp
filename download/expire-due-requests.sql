-- إغلاق الطلبات منتهية المهلة + إشعارات
-- نفّذ في Supabase SQL Editor بعد create-notification-rpc-v2.sql

CREATE OR REPLACE FUNCTION public.expire_due_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  closed_count integer := 0;
  provider_ids uuid[];
BEGIN
  FOR r IN
    SELECT id, user_id, title
    FROM public.service_requests
    WHERE status = 'open'
      AND expires_at IS NOT NULL
      AND expires_at <= now()
    LIMIT 200
  LOOP
    UPDATE public.service_requests
    SET status = 'closed'
    WHERE id = r.id AND status = 'open';

    IF FOUND THEN
      closed_count := closed_count + 1;

      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        r.user_id,
        'request_expired',
        'انتهت مهلة طلبك',
        format('أُغلق الطلب "%s" لانتهاء المهلة. يمكنك تقييم من تعاملت معه من سجل طلباتك.', r.title),
        jsonb_build_object('request_id', r.id, 'action', 'request')
      );

      SELECT coalesce(array_agg(provider_id), ARRAY[]::uuid[])
      INTO provider_ids
      FROM public.offers
      WHERE request_id = r.id AND status = 'pending';

      UPDATE public.offers
      SET status = 'rejected'
      WHERE request_id = r.id AND status = 'pending';

      IF cardinality(provider_ids) > 0 THEN
        INSERT INTO public.notifications (user_id, type, title, body, data)
        SELECT
          unnest(provider_ids),
          'request_expired',
          'انتهت مهلة الطلب',
          format('الطلب "%s" أُغلق لانتهاء المهلة.', r.title),
          jsonb_build_object('request_id', r.id, 'action', 'request');
      END IF;
    END IF;
  END LOOP;

  RETURN closed_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_due_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_due_requests() TO service_role;
