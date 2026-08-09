import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  computeVerification,
  VERIFIED_MAX_REPORTS,
  VERIFIED_MIN_HIGH_REVIEWS,
  VERIFIED_MIN_OFFERS,
  type VerificationStats,
} from '@/lib/verification';

/**
 * GET /api/admin/verification?id=uuid
 * إحصائيات وشروط التوثيق لمقدم خدمة.
 */
export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return adminUnauthorized();

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'معرّف مطلوب' }, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();

    const [profileRes, offersRes, reviewsRes, reportsRes] = await Promise.all([
      db.from('profiles').select('id, admin_verified, role').eq('id', id).maybeSingle(),
      db.from('offers').select('id', { count: 'exact', head: true }).eq('provider_id', id),
      db
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('reviewed_id', id)
        .eq('review_type', 'provider')
        .gt('rating', 4),
      db.from('reports').select('id', { count: 'exact', head: true }).eq('reported_id', id),
    ]);

    if (profileRes.error) {
      const msg = profileRes.error.message || '';
      if (/admin_verified/i.test(msg) || /column/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              'عمود التوثيق غير موجود في قاعدة البيانات. نفّذ ملف download/add-provider-verification.sql في Supabase SQL Editor ثم أعد المحاولة.',
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    if (!profileRes.data) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const stats: VerificationStats = {
      offersCount: offersRes.count ?? 0,
      highReviewsCount: reviewsRes.count ?? 0,
      reportsCount: reportsRes.count ?? 0,
    };

    const result = computeVerification(Boolean(profileRes.data.admin_verified), stats);

    return NextResponse.json({
      ...result,
      thresholds: {
        minOffers: VERIFIED_MIN_OFFERS,
        minHighReviews: VERIFIED_MIN_HIGH_REVIEWS,
        maxReports: VERIFIED_MAX_REPORTS,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'تعذّر الجلب';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
