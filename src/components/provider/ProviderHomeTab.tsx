'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase, type ServiceRequest, type Profile } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import {
  YEMEN_GOVERNORATES,
  getCategoryName,
  getCategoryPath,
  getCategoryGroupId,
  matchesCategoryFilter,
} from '@/lib/constants';
import { ServiceCategoryPicker } from '@/components/shared/ServiceCategoryPicker';
import { RequestCard } from '@/components/shared/RequestCard';

export function ProviderHomeTab({
  onOpenRequest,
}: {
  onOpenRequest: (r: ServiceRequest, owner?: Profile) => void;
}) {
  const { profile } = useAuth();
  const defaultCategory = getCategoryGroupId(profile?.service_category) ?? 'all';
  const defaultGovernorate = profile?.governorate || 'all';

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [owners, setOwners] = useState<Record<string, Profile>>({});
  const [offersCount, setOffersCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(defaultCategory);
  const [governorateFilter, setGovernorateFilter] = useState<string>(defaultGovernorate);
  const [showFilters, setShowFilters] = useState(false);
  const [defaultsReady, setDefaultsReady] = useState(false);

  // مزامنة الافتراضي عند جاهزية الملف الشخصي
  useEffect(() => {
    if (!profile || defaultsReady) return;
    const main = getCategoryGroupId(profile.service_category) ?? 'all';
    const gov = profile.governorate || 'all';
    setCategoryFilter(main);
    setGovernorateFilter(gov);
    setDefaultsReady(true);
  }, [profile, defaultsReady]);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('service_requests')
      .select('*, profile:profiles!user_id(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    const now = Date.now();
    const reqs = ((data ?? []) as (ServiceRequest & { profile: Profile })[]).filter((r) => {
      if (!r.expires_at) return true;
      return new Date(r.expires_at).getTime() > now;
    });
    setRequests(reqs.map(({ profile: _p, ...r }) => r));

    const ownerMap: Record<string, Profile> = {};
    reqs.forEach((r) => {
      if (r.profile) ownerMap[r.user_id] = r.profile;
    });
    setOwners(ownerMap);

    if (reqs.length > 0) {
      const { data: offers } = await supabase
        .from('offers')
        .select('request_id')
        .in('request_id', reqs.map((r) => r.id));
      const counts: Record<string, number> = {};
      (offers ?? []).forEach((o) => {
        counts[o.request_id] = (counts[o.request_id] ?? 0) + 1;
      });
      setOffersCount(counts);
    } else {
      setOffersCount({});
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('provider-requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_requests' },
        () => load()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests' },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const filtered = useMemo(() => {
    let list = requests;

    if (categoryFilter !== 'all') {
      list = list.filter((r) => matchesCategoryFilter(r.category, categoryFilter));
    }
    if (governorateFilter !== 'all') {
      list = list.filter((r) => r.governorate === governorateFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        getCategoryName(r.category).toLowerCase().includes(q) ||
        getCategoryPath(r.category).toLowerCase().includes(q)
      );
    }

    // الأقرب لانتهاء المهلة أولاً
    return [...list].sort((a, b) => {
      const ae = a.expires_at ? new Date(a.expires_at).getTime() : Number.POSITIVE_INFINITY;
      const be = b.expires_at ? new Date(b.expires_at).getTime() : Number.POSITIVE_INFINITY;
      if (ae !== be) return ae - be;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [requests, categoryFilter, governorateFilter, search]);

  const isDefaultView =
    categoryFilter === defaultCategory &&
    governorateFilter === defaultGovernorate &&
    !search.trim();

  const hasCustomFilters = !isDefaultView;

  const resetToDefaults = () => {
    setCategoryFilter(defaultCategory);
    setGovernorateFilter(defaultGovernorate);
    setSearch('');
  };

  const showAll = () => {
    setCategoryFilter('all');
    setGovernorateFilter('all');
    setSearch('');
  };

  const mainName = defaultCategory !== 'all' ? getCategoryName(defaultCategory) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 space-y-2.5 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {(mainName || defaultGovernorate !== 'all') && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2 text-xs leading-relaxed">
            <span className="text-muted-foreground">الافتراضي: </span>
            {mainName && (
              <span className="font-semibold text-emerald-700">مجال {mainName}</span>
            )}
            {defaultGovernorate !== 'all' && (
              <>
                {mainName ? <span className="text-muted-foreground"> · </span> : null}
                <span className="font-semibold text-emerald-700">{defaultGovernorate}</span>
              </>
            )}
            <span className="text-muted-foreground"> · مرتّب بأقرب مهلة انتهاء</span>
          </div>
        )}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الطلبات…"
            className="pr-9 h-11 rounded-xl bg-muted/50 border-border/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="h-9 rounded-xl text-xs font-medium"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 ml-1.5" />
            فلترة
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            className="h-9 rounded-xl text-xs text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
            تحديث
          </Button>
          {hasCustomFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-9 rounded-xl text-xs text-muted-foreground mr-auto"
            >
              الافتراضي
            </Button>
          )}
          {isDefaultView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={showAll}
              className="h-9 rounded-xl text-xs text-muted-foreground mr-auto"
            >
              عرض الكل
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-2 pt-1">
            <ServiceCategoryPicker
              value={categoryFilter}
              onChange={setCategoryFilter}
              mode="filter"
              allowAll
              placeholder="كل المجالات"
              triggerClassName="w-full h-10 rounded-xl bg-muted/40 border border-border/40 px-3 text-xs text-right flex items-center justify-between gap-2"
            />
            <Select value={governorateFilter} onValueChange={setGovernorateFilter}>
              <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/40 text-xs">
                <SelectValue placeholder="المحافظة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المحافظات</SelectItem>
                {YEMEN_GOVERNORATES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="p-4 space-y-3 pb-8">
          {loading ? (
            <LoadingList />
          ) : filtered.length === 0 ? (
            <EmptyState
              hasFilters={hasCustomFilters || isDefaultView}
              onReset={hasCustomFilters ? resetToDefaults : showAll}
            />
          ) : (
            <>
              <div className="text-xs text-muted-foreground px-1">
                {filtered.length} طلب مفتوح
                {isDefaultView ? ' في نطاقك' : ''}
              </div>
              {filtered.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  profile={owners[r.user_id]}
                  offersCount={offersCount[r.id]}
                  onClick={() => onOpenRequest(r, owners[r.user_id])}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card rounded-2xl p-4 border border-border/60">
          <div className="flex gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
        <Search className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">لا توجد طلبات حاليًا</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
        {hasFilters
          ? 'لا توجد طلبات ضمن مجالك ومحافظتك — جرّب «عرض الكل» أو عدّل الفلاتر'
          : 'تابع التطبيق، ستظهر الطلبات الجديدة فور نشرها'}
      </p>
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="mt-3 h-9 rounded-xl text-xs"
        >
          تعديل العرض
        </Button>
      )}
    </div>
  );
}
