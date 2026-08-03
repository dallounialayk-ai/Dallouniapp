import { NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  if (!(await requireAdminApi())) return adminUnauthorized();

  try {
    const db = getSupabaseAdmin();
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      usersRes,
      providersRes,
      pendingProvidersRes,
      blockedRes,
      requestsRes,
      openRequestsRes,
      offersRes,
      messagesRes,
      reviewsRes,
      reportsPendingRes,
      reportsTotalRes,
      notifsRes,
      newUsers7,
      newProviders7,
      messages7,
      requests30,
    ] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'provider'),
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'provider')
        .eq('is_approved', false),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('is_blocked', true),
      db.from('service_requests').select('id', { count: 'exact', head: true }),
      db.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      db.from('offers').select('id', { count: 'exact', head: true }),
      db.from('messages').select('id', { count: 'exact', head: true }),
      db.from('reviews').select('id, rating', { count: 'exact' }),
      db.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('reports').select('id', { count: 'exact', head: true }),
      db.from('notifications').select('id', { count: 'exact', head: true }),
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', since7),
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'provider')
        .gte('created_at', since7),
      db.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', since7),
      db.from('service_requests').select('id', { count: 'exact', head: true }).gte('created_at', since30),
    ]);

    const ratings = (reviewsRes.data ?? []).map((r) => Number(r.rating) || 0);
    const avgRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const totalUsers = (usersRes.count ?? 0) + (providersRes.count ?? 0);
    const msgs7 = messages7.count ?? 0;
    const avgDailyMessages7 = Math.round((msgs7 / 7) * 10) / 10;
    const avgDailyRequests30 = Math.round(((requests30.count ?? 0) / 30) * 10) / 10;

    return NextResponse.json({
      totals: {
        users: usersRes.count ?? 0,
        providers: providersRes.count ?? 0,
        totalAccounts: totalUsers,
        pendingProviders: pendingProvidersRes.count ?? 0,
        blocked: blockedRes.count ?? 0,
        requests: requestsRes.count ?? 0,
        openRequests: openRequestsRes.count ?? 0,
        offers: offersRes.count ?? 0,
        messages: messagesRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
        avgRating: Math.round(avgRating * 10) / 10,
        reportsPending: reportsPendingRes.count ?? 0,
        reportsTotal: reportsTotalRes.count ?? 0,
        notifications: notifsRes.count ?? 0,
      },
      activity: {
        newUsers7: newUsers7.count ?? 0,
        newProviders7: newProviders7.count ?? 0,
        messages7: msgs7,
        avgDailyMessages7,
        requests30: requests30.count ?? 0,
        avgDailyRequests30,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'خطأ في جلب الإحصائيات';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
