import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function escapeCsv(value: unknown) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return adminUnauthorized();

  const sp = req.nextUrl.searchParams;
  const role = sp.get('role'); // user | provider | all
  const format = (sp.get('format') || 'csv').toLowerCase();
  const q = (sp.get('q') || '').trim();
  const approved = sp.get('approved');
  const governorate = sp.get('governorate') || '';
  const category = sp.get('category') || '';

  try {
    const db = getSupabaseAdmin();
    let query = db.from('profiles').select('*').order('created_at', { ascending: false }).limit(5000);
    if (role === 'user' || role === 'provider') query = query.eq('role', role);
    if (approved === 'true') query = query.eq('is_approved', true);
    if (approved === 'false') query = query.eq('is_approved', false);
    if (governorate) query = query.eq('governorate', governorate);
    if (category) query = query.eq('service_category', category);
    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = data ?? [];

    const headers = [
      'id',
      'full_name',
      'email',
      'phone',
      'whatsapp_number',
      'governorate',
      'role',
      'service_category',
      'is_approved',
      'is_blocked',
      'rating_override',
      'latitude',
      'longitude',
      'bio',
      'created_at',
    ];

    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => escapeCsv((r as Record<string, unknown>)[h])).join(',')
      ),
    ];
    const csv = '\uFEFF' + lines.join('\n');

    if (format === 'xlsx' || format === 'excel') {
      // جدول HTML يفتحه Excel مع دعم العربية
      const th = headers.map((h) => `<th>${h}</th>`).join('');
      const body = rows
        .map(
          (r) =>
            `<tr>${headers
              .map((h) => `<td>${String((r as Record<string, unknown>)[h] ?? '').replace(/</g, '&lt;')}</td>`)
              .join('')}</tr>`
        )
        .join('');
      const html = `<html><head><meta charset="UTF-8"></head><body><table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></body></html>`;
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': `attachment; filename="dallouni-${role || 'users'}.xls"`,
        },
      });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="dallouni-${role || 'users'}.csv"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'تعذّر التصدير';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
