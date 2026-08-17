import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await requireAdminApi())) return adminUnauthorized();
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'معرّف الطلب مطلوب' }, { status: 400 });

  try {
    const db = getSupabaseAdmin();
    const { data: request, error: fetchError } = await db
      .from('service_requests')
      .select('id, title, user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!request) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    const { error: deleteError } = await db.from('service_requests').delete().eq('id', id);
    if (deleteError) throw deleteError;

    if (request.user_id) {
      await db.from('notifications').insert({
        user_id: request.user_id,
        type: 'request_deleted',
        title: 'تم حذف طلبك',
        body: `حذفت الإدارة طلب الخدمة "${request.title}".`,
        data: { request_id: request.id, action: 'profile', source: 'admin' },
      });
    }

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'تعذّر حذف الطلب';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
