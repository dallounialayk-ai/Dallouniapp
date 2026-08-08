import { supabase } from '@/lib/supabase';

export type NotificationType =
  | 'message'
  | 'offer'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'new_request'
  | 'request_closed'
  | 'request_expired'
  | 'admin_approval'
  | 'admin_unapproved'
  | 'admin_verified'
  | 'admin_unverified'
  | 'admin_blocked'
  | 'admin_unblocked'
  | 'admin_broadcast'
  | 'report_received'
  | 'report_resolved'
  | 'auto_verified'
  | 'rating_updated';

export type NotificationPayload = {
  userId: string;
  type: NotificationType | string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

/** إنشاء إشعار واحد عبر RPC (يتجاوز RLS) */
export async function notifyUser(payload: NotificationPayload): Promise<boolean> {
  if (!payload.userId) return false;
  const { error } = await supabase.rpc('create_notification', {
    p_user_id: payload.userId,
    p_type: payload.type,
    p_title: payload.title,
    p_body: payload.body ?? null,
    p_data: payload.data ?? {},
  });
  if (error) {
    console.error('[notifyUser]', error.message);
    return false;
  }
  return true;
}

/** إنشاء إشعارات لعدة مستخدمين */
export async function notifyMany(
  userIds: string[],
  type: NotificationType | string,
  title: string,
  body?: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return true;
  const { error } = await supabase.rpc('create_notifications_batch', {
    p_user_ids: unique,
    p_type: type,
    p_title: title,
    p_body: body ?? null,
    p_data: data ?? {},
  });
  if (error) {
    console.error('[notifyMany]', error.message);
    return false;
  }
  return true;
}

/**
 * إغلاق الطلبات المنتهية مهلتها وإرسال إشعارات.
 * يعتمد على دالة SQL expire_due_requests إن وُجدت، وإلا معالجة من العميل.
 */
export async function expireDueRequestsClient(): Promise<number> {
  const { data: rpcCount, error: rpcError } = await supabase.rpc('expire_due_requests');
  if (!rpcError && typeof rpcCount === 'number') return rpcCount;

  // Fallback بدون الدالة: إغلاق + إشعار من العميل (لصاحب الطلب فقط إن كان يملكها)
  const nowIso = new Date().toISOString();
  const { data: due } = await supabase
    .from('service_requests')
    .select('id, user_id, title')
    .eq('status', 'open')
    .not('expires_at', 'is', null)
    .lte('expires_at', nowIso)
    .limit(50);

  if (!due?.length) return 0;

  let closed = 0;
  for (const req of due) {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'closed' })
      .eq('id', req.id)
      .eq('status', 'open');
    if (error) continue;
    closed += 1;

    await notifyUser({
      userId: req.user_id,
      type: 'request_expired',
      title: 'انتهت مهلة طلبك',
      body: `أُغلق الطلب "${req.title}" لانتهاء المهلة. يمكنك تقييم من تعاملت معه من سجل طلباتك.`,
      data: { request_id: req.id, action: 'request' },
    });

    const { data: pendingOffers } = await supabase
      .from('offers')
      .select('provider_id')
      .eq('request_id', req.id)
      .eq('status', 'pending');

    const providerIds = (pendingOffers ?? []).map((o) => o.provider_id);
    if (providerIds.length) {
      await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .eq('request_id', req.id)
        .eq('status', 'pending');
      await notifyMany(
        providerIds,
        'request_expired',
        'انتهت مهلة الطلب',
        `الطلب "${req.title}" أُغلق لانتهاء المهلة.`,
        { request_id: req.id, action: 'request' }
      );
    }
  }
  return closed;
}

/**
 * إن أصبح مقدم الخدمة مؤهلاً للتوثيق التلقائي ولم يُشعَر بعد، أرسل إشعاراً.
 * يُستدعى بعد أحداث قد تغيّر الإحصائيات (عرض / تقييم).
 */
export async function maybeNotifyAutoVerified(providerId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, admin_verified')
    .eq('id', providerId)
    .maybeSingle();
  if (!profile || profile.role !== 'provider' || profile.admin_verified) return;

  const { fetchProviderVerification } = await import('@/lib/verification');
  const result = await fetchProviderVerification(providerId, false);
  if (!result.autoEligible) return;

  // تجنّب تكرار الإشعار: ابحث عن إشعار auto_verified حديث
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', providerId)
    .eq('type', 'auto_verified')
    .gte('created_at', since)
    .limit(1);
  if (existing && existing.length > 0) return;

  await notifyUser({
    userId: providerId,
    type: 'auto_verified',
    title: 'حسابك أصبح موثّقاً',
    body: 'استوفيت شروط التوثيق التلقائي وظهرت العلامة الزرقاء على ملفك.',
    data: { source: 'auto', action: 'profile' },
  });
}
