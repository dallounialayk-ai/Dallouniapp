import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * إغلاق الطلبات منتهية المهلة (يمكن استدعاؤها يدوياً أو من Cron).
 * محمية بمفتاح اختياري: CRON_SECRET في الهيدر Authorization: Bearer ...
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.rpc('expire_due_requests');
    if (error) {
      // fallback يدوي إن لم تُنشأ الدالة بعد
      const nowIso = new Date().toISOString();
      const { data: due, error: dueErr } = await db
        .from('service_requests')
        .select('id, user_id, title')
        .eq('status', 'open')
        .not('expires_at', 'is', null)
        .lte('expires_at', nowIso)
        .limit(200);
      if (dueErr) throw dueErr;

      let closed = 0;
      for (const req of due ?? []) {
        const { error: upErr } = await db
          .from('service_requests')
          .update({ status: 'closed' })
          .eq('id', req.id)
          .eq('status', 'open');
        if (upErr) continue;
        closed += 1;

        await db.from('notifications').insert({
          user_id: req.user_id,
          type: 'request_expired',
          title: 'انتهت مهلة طلبك',
          body: `أُغلق الطلب "${req.title}" لانتهاء المهلة. يمكنك تقييم من تعاملت معه من سجل طلباتك.`,
          data: { request_id: req.id, action: 'request' },
        });

        const { data: pending } = await db
          .from('offers')
          .select('provider_id')
          .eq('request_id', req.id)
          .eq('status', 'pending');
        const ids = (pending ?? []).map((o) => o.provider_id);
        if (ids.length) {
          await db
            .from('offers')
            .update({ status: 'rejected' })
            .eq('request_id', req.id)
            .eq('status', 'pending');
          await db.from('notifications').insert(
            ids.map((uid) => ({
              user_id: uid,
              type: 'request_expired',
              title: 'انتهت مهلة الطلب',
              body: `الطلب "${req.title}" أُغلق لانتهاء المهلة.`,
              data: { request_id: req.id, action: 'request' },
            }))
          );
        }
      }
      return NextResponse.json({ closed, mode: 'fallback' });
    }

    return NextResponse.json({ closed: data ?? 0, mode: 'rpc' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'فشل الإغلاق';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
