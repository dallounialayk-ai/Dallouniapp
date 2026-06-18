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
import { SERVICE_CATEGORIES, YEMEN_GOVERNORATES, getCategoryName } from '@/lib/constants';
import { RequestCard } from '@/components/shared/RequestCard';

export function ProviderHomeTab({
  onOpenRequest,
}: {
  onOpenRequest: (r: ServiceRequest, owner?: Profile) => void;
}) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [owners, setOwners] = useState<Record<string, Profile>>({});
  const [offersCount, setOffersCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('service_requests')
      .select('*, profile:profiles!user_id(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    const reqs = (data ?? []) as (ServiceRequest & { profile: Profile })[];
    setRequests(reqs.map(({ profile, ...r }) => r));

    const ownerMap: Record<string, Profile> = {};
    reqs.forEach((r) => {
      if (r.profile) ownerMap[r.user_id] = r.profile;
    });
    setOwners(ownerMap);

    // Count offers per request
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
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscribe for new requests
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
    // Default: prioritize requests matching provider's category
    if (profile?.service_category && categoryFilter === 'all') {
      list = [...list].sort((a, b) => {
        const aMatch = a.category === profile.service_category ? 0 : 1;
        const bMatch = b.category === profile.service_category ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    if (categoryFilter !== 'all') {
      list = list.filter((r) => r.category === categoryFilter);
    }
    if (governorateFilter !== 'all') {
      list = list.filter((r) => r.governorate === governorateFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        getCategoryName(r.category).toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, categoryFilter, governorateFilter, search, profile]);

  const hasActiveFilters = categoryFilter !== 'all' || governorateFilter !== 'all' || search.trim();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 space-y-2.5 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {profile?.service_category && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2 text-xs">
            <span className="text-muted-foreground">مجالك: </span>
            <span className="font-semibold text-emerald-700">
              {getCategoryName(profile.service_category)}
            </span>
            <span className="text-muted-foreground mr-2"> • نعرض طلبات مجالك أولًا</span>
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

        <div className="flex items-center gap-2">
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
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter('all');
                setGovernorateFilter('all');
                setSearch('');
              }}
              className="h-9 rounded-xl text-xs text-muted-foreground mr-auto"
            >
              مسح الفلاتر
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/40 text-xs">
                <SelectValue placeholder="المجال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المجالات</SelectItem>
                {SERVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <EmptyState hasFilters={!!hasActiveFilters} onReset={() => {
              setCategoryFilter('all');
              setGovernorateFilter('all');
              setSearch('');
            }} />
          ) : (
            <>
              <div className="text-xs text-muted-foreground px-1">
                {filtered.length} طلب مفتوح
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
        {hasFilters ? 'جرّب تعديل الفلاتر' : 'تابع التطبيق، ستظهر الطلبات الجديدة فور نشرها'}
      </p>
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="mt-3 h-9 rounded-xl text-xs"
        >
          مسح الفلاتر
        </Button>
      )}
    </div>
  );
}
