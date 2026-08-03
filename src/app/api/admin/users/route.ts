import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return adminUnauthorized();

  const sp = req.nextUrl.searchParams;
  const role = sp.get('role'); // user | provider | all
  const q = (sp.get('q') || '').trim();
  const approved = sp.get('approved'); // true | false | all
  const blocked = sp.get('blocked');
  const governorate = sp.get('governorate') || '';
  const category = sp.get('category') || '';
  const sort = sp.get('sort') || 'created_at';
  const dir = sp.get('dir') === 'asc' ? true : false;
  const page = Math.max(1, Number(sp.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') || 25)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const db = getSupabaseAdmin();
    let query = db.from('profiles').select('*', { count: 'exact' });

    if (role === 'user' || role === 'provider') query = query.eq('role', role);
    if (approved === 'true') query = query.eq('is_approved', true);
    if (approved === 'false') query = query.eq('is_approved', false);
    if (blocked === 'true') query = query.eq('is_blocked', true);
    if (blocked === 'false') query = query.eq('is_blocked', false);
    if (governorate) query = query.eq('governorate', governorate);
    if (category) query = query.eq('service_category', category);

    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,whatsapp_number.ilike.%${q}%`
      );
    }

    const allowedSort = new Set([
      'created_at',
      'full_name',
      'email',
      'governorate',
      'service_category',
      'phone',
    ]);
    const sortCol = allowedSort.has(sort) ? sort : 'created_at';
    query = query.order(sortCol, { ascending: dir }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'خطأ في جلب المستخدمين';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
