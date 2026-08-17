import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getDescendantLeafIds, getCategoryMeta } from '@/lib/constants';

const PROFILE_FIELDS = 'id, full_name, email, phone, whatsapp_number, governorate, role';

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return adminUnauthorized();

  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') || '').trim();
  const status = sp.get('status') || 'all';
  const governorate = sp.get('governorate') || '';
  const category = sp.get('category') || '';
  const page = Math.max(1, Number(sp.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') || 25)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const db = getSupabaseAdmin();

    let matchingUserIds: string[] = [];
    if (q) {
      const { data: profiles } = await db
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
      matchingUserIds = (profiles ?? []).map((p) => p.id as string);
    }

    const applyFilters = <
      T extends {
        eq: (column: string, value: string) => T;
        in: (column: string, values: string[]) => T;
        or: (filters: string) => T;
      },
    >(
      query: T
    ): T => {
      let next = query;
      if (status === 'open' || status === 'closed') next = next.eq('status', status);
      if (governorate) next = next.eq('governorate', governorate);
      if (category) {
        const meta = getCategoryMeta(category);
        if (meta?.kind === 'leaf') {
          next = next.eq('category', category);
        } else {
          const leaves = getDescendantLeafIds(category);
          const ids = Array.from(new Set([...leaves, category]));
          next = next.in('category', ids);
        }
      }
      if (q) {
        const userFilter = matchingUserIds.length
          ? `,user_id.in.(${matchingUserIds.join(',')})`
          : '';
        next = next.or(
          `title.ilike.%${q}%,description.ilike.%${q}%,location_label.ilike.%${q}%${userFilter}`
        );
      }
      return next;
    };

    const selectWithJoin = `
      *,
      profile:profiles!service_requests_user_id_fkey(${PROFILE_FIELDS}),
      offers(count)
    `;

    const query = applyFilters(
      db
        .from('service_requests')
        .select(selectWithJoin, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
    );

    const { data, error, count } = await query;
    if (!error) {
      const items = (data ?? []).map((row) => {
        const r = row as Record<string, unknown> & {
          offers?: { count: number }[] | number;
        };
        const offersRaw = r.offers;
        const offers_count = Array.isArray(offersRaw)
          ? Number(offersRaw[0]?.count ?? 0)
          : Number(offersRaw ?? 0);
        const { offers: _omit, ...rest } = r;
        void _omit;
        return { ...rest, offers_count };
      });
      return NextResponse.json({ items, total: count ?? 0, page, limit });
    }

    const fallback = applyFilters(
      db
        .from('service_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
    );
    const fb = await fallback;
    if (fb.error) throw fb.error;

    const userIds = Array.from(
      new Set((fb.data ?? []).map((r) => r.user_id).filter(Boolean))
    ) as string[];
    const requestIds = (fb.data ?? []).map((r) => r.id as string);

    const [{ data: profiles }, { data: offerRows }] = await Promise.all([
      db
        .from('profiles')
        .select(PROFILE_FIELDS)
        .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
      requestIds.length
        ? db.from('offers').select('request_id').in('request_id', requestIds)
        : Promise.resolve({ data: [] as { request_id: string }[] }),
    ]);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    const offerCount: Record<string, number> = {};
    for (const o of offerRows ?? []) {
      offerCount[o.request_id] = (offerCount[o.request_id] ?? 0) + 1;
    }

    const items = (fb.data ?? []).map((r) => ({
      ...r,
      profile: profileMap[r.user_id] ?? null,
      offers_count: offerCount[r.id] ?? 0,
    }));

    return NextResponse.json({ items, total: fb.count ?? 0, page, limit });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'تعذّر جلب طلبات الخدمة';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
