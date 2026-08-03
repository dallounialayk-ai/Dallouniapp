import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  if (!(await requireAdminApi())) return adminUnauthorized();

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim();
  const message = String(body.body ?? '').trim();
  const audience = String(body.audience ?? 'all'); // all | user | provider
  const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];

  if (!title) {
    return NextResponse.json({ error: 'عنوان الإشعار مطلوب' }, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();
    let targets: string[] = [];

    if (userIds.length > 0) {
      targets = userIds;
    } else {
      let q = db.from('profiles').select('id').eq('is_blocked', false);
      if (audience === 'user' || audience === 'provider') {
        q = q.eq('role', audience);
      }
      const { data, error } = await q;
      if (error) throw error;
      targets = (data ?? []).map((p) => p.id);
    }

    if (targets.length === 0) {
      return NextResponse.json({ error: 'لا يوجد مستلمون' }, { status: 400 });
    }

    const rows = targets.map((user_id) => ({
      user_id,
      type: 'admin_broadcast',
      title,
      body: message,
      data: { source: 'admin', audience },
    }));

    // إدخال على دفعات لتجنب حدود الحجم
    const chunk = 200;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      const { error } = await db.from('notifications').insert(slice);
      if (error) throw error;
      inserted += slice.length;
    }

    return NextResponse.json({ ok: true, sent: inserted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'تعذّر إرسال الإشعارات';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return adminUnauthorized();

  const limit = Math.min(100, Number(req.nextUrl.searchParams.get('limit') || 40));

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('notifications')
      .select('id, user_id, type, title, body, created_at, read')
      .eq('type', 'admin_broadcast')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'تعذّر جلب الإشعارات';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
