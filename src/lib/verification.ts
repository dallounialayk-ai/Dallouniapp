import { supabase } from '@/lib/supabase';

/** أكثر من 50 عرض سعر */
export const VERIFIED_MIN_OFFERS = 50;

/** أكثر من 15 تقييم أعلى من 4 نجوم (أي 5 نجوم لأن التقييم عدد صحيح) */
export const VERIFIED_MIN_HIGH_REVIEWS = 15;

/** إذا تجاوزت البلاغات 10 تُخفى علامة التوثيق التلقائية */
export const VERIFIED_MAX_REPORTS = 10;

export type VerificationStats = {
  offersCount: number;
  highReviewsCount: number;
  reportsCount: number;
};

export type VerificationResult = {
  verified: boolean;
  source: 'admin' | 'auto' | 'none';
  stats: VerificationStats;
  /** هل يستوفي شروط التوثيق التلقائي حالياً؟ */
  autoEligible: boolean;
};

export function computeVerification(
  adminVerified: boolean | null | undefined,
  stats: VerificationStats
): VerificationResult {
  const autoEligible =
    stats.offersCount > VERIFIED_MIN_OFFERS &&
    stats.highReviewsCount > VERIFIED_MIN_HIGH_REVIEWS &&
    stats.reportsCount <= VERIFIED_MAX_REPORTS;

  if (adminVerified) {
    return { verified: true, source: 'admin', stats, autoEligible };
  }
  if (autoEligible) {
    return { verified: true, source: 'auto', stats, autoEligible };
  }
  return { verified: false, source: 'none', stats, autoEligible };
}

/**
 * جلب إحصائيات التوثيق لمجموعة مقدمي خدمة دفعة واحدة.
 */
export async function fetchVerificationStatsMap(
  providerIds: string[]
): Promise<Record<string, VerificationStats>> {
  const unique = Array.from(new Set(providerIds.filter(Boolean)));
  const empty: VerificationStats = {
    offersCount: 0,
    highReviewsCount: 0,
    reportsCount: 0,
  };
  const map: Record<string, VerificationStats> = {};
  unique.forEach((id) => {
    map[id] = { ...empty };
  });
  if (unique.length === 0) return map;

  const [offersRes, reviewsRes, reportsRes] = await Promise.all([
    supabase.from('offers').select('provider_id').in('provider_id', unique),
    supabase
      .from('reviews')
      .select('reviewed_id, rating')
      .eq('review_type', 'provider')
      .gt('rating', 4)
      .in('reviewed_id', unique),
    supabase.from('reports').select('reported_id').in('reported_id', unique),
  ]);

  for (const row of offersRes.data ?? []) {
    const id = row.provider_id as string;
    if (map[id]) map[id].offersCount += 1;
  }
  for (const row of reviewsRes.data ?? []) {
    const id = row.reviewed_id as string;
    if (map[id]) map[id].highReviewsCount += 1;
  }
  for (const row of reportsRes.data ?? []) {
    const id = row.reported_id as string;
    if (map[id]) map[id].reportsCount += 1;
  }

  return map;
}

export async function fetchProviderVerification(
  providerId: string,
  adminVerified?: boolean | null
): Promise<VerificationResult> {
  const map = await fetchVerificationStatsMap([providerId]);
  return computeVerification(adminVerified, map[providerId] ?? {
    offersCount: 0,
    highReviewsCount: 0,
    reportsCount: 0,
  });
}
