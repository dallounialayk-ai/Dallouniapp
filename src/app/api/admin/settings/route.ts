import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  if (!(await requireAdminApi())) return adminUnauthorized();

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('app_settings').select('key, value, updated_at');
    if (error) throw error;

    const map: Record<string, unknown> = {};
    for (const row of data ?? []) {
      map[row.key] = row.value;
    }

    return NextResponse.json({
      provider_approval_required: Boolean(map.provider_approval_required === true || map.provider_approval_required === 'true'),
      raw: map,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'تعذّر جلب الإعدادات';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdminApi())) return adminUnauthorized();

  const body = await req.json().catch(() => ({}));

  try {
    const db = getSupabaseAdmin();

    if (typeof body.provider_approval_required === 'boolean') {
      const { error } = await db.from('app_settings').upsert({
        key: 'provider_approval_required',
        value: body.provider_approval_required,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'تعذّر حفظ الإعدادات';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
