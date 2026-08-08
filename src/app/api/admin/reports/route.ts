import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return adminUnauthorized();

  const status = req.nextUrl.searchParams.get('status') || 'all';
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit') || 30)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const db = getSupabaseAdmin();
    let query = db
      .from('reports')
      .select(
        `
        *,
        reporter:profiles!reports_reporter_id_fkey(id, full_name, email, role, phone),
        reported:profiles!reports_reported_id_fkey(id, full_name, email, role, phone)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status !== 'all') query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) {
      // إن فشلت علاقة الأسماء، نجلب بلاغات ثم نثري يدوياً
      let fallback = db.from('reports').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
      if (status !== 'all') fallback = fallback.eq('status', status);
      const fb = await fallback;
      if (fb.error) throw fb.error;

      const ids = Array.from(
        new Set(
          (fb.data ?? []).flatMap((r) => [r.reporter_id, r.reported_id]).filter(Boolean)
        )
      );
      const { data: profiles } = await db
        .from('profiles')
        .select('id, full_name, email, role, phone')
        .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
      const map = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
      const items = (fb.data ?? []).map((r) => ({
        ...r,
        reporter: map[r.reporter_id] ?? null,
        reported: map[r.reported_id] ?? null,
      }));
      return NextResponse.json({ items, total: fb.count ?? 0, page, limit });
    }

    return NextResponse.json({ items: data ?? [], total: count ?? 0, page, limit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'تعذّر جلب البلاغات';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdminApi())) return adminUnauthorized();

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? '');
  if (!id) return NextResponse.json({ error: 'معرّف البلاغ مطلوب' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.status === 'string') patch.status = body.status;
  if (typeof body.admin_note === 'string') patch.admin_note = body.admin_note;
  if (body.status === 'resolved' || body.status === 'dismissed') {
    patch.resolved_at = new Date().toISOString();
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('reports').update(patch).eq('id', id).select('*').single();
    if (error) throw error;

    if (data && (body.status === 'resolved' || body.status === 'dismissed' || body.status === 'reviewed')) {
      const statusLabel =
        body.status === 'resolved' ? 'تم حل البلاغ' :
        body.status === 'dismissed' ? 'تم رفض البلاغ' : 'تم مراجعة البلاغ';
      const note = typeof body.admin_note === 'string' && body.admin_note.trim()
        ? ` ملاحظة الإدارة: ${body.admin_note.trim()}`
        : '';

      const rows = [
        {
          user_id: data.reporter_id as string,
          type: 'report_resolved',
          title: statusLabel,
          body: `تم تحديث حالة بلاغك.${note}`,
          data: { report_id: data.id, action: 'profile' },
        },
        {
          user_id: data.reported_id as string,
          type: 'report_resolved',
          title: 'تحديث بخصوص بلاغ على حسابك',
          body: `${statusLabel}.${note}`,
          data: { report_id: data.id, action: 'profile' },
        },
      ].filter((r) => r.user_id);

      if (rows.length) await db.from('notifications').insert(rows);
    }

    return NextResponse.json({ item: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'تعذّر تحديث البلاغ';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
