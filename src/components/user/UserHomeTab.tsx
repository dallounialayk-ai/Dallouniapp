'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase, type Profile, type Review } from '@/lib/supabase';
import { SERVICE_CATEGORIES, getCategoryName } from '@/lib/constants';
import { ProviderCard } from '@/components/shared/ProviderCard';

type ProviderWithMeta = Profile & {
  avgRating?: number;
  reviewsCount?: number;
};

export function UserHomeTab({
  onOpenProvider,
}: {
  onOpenProvider: (p: Profile) => void;
}) {
  const [providers, setProviders] = useState<ProviderWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'provider')
      .order('created_at', { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    // Fetch reviews summary per provider (single round-trip)
    const providerIds = data.map((p) => p.id);
    let reviewsMap: Record<string, { avg: number; count: number }> = {};
    if (providerIds.length > 0) {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('reviewed_id, rating')
        .eq('review_type', 'provider')
        .in('reviewed_id', providerIds);
      if (reviews) {
        const grouped: Record<string, number[]> = {};
        reviews.forEach((r) => {
          if (!grouped[r.reviewed_id]) grouped[r.reviewed_id] = [];
          grouped[r.reviewed_id].push(r.rating);
        });
        Object.entries(grouped).forEach(([id, ratings]) => {
          reviewsMap[id] = {
            avg: ratings.reduce((s, r) => s + r, 0) / ratings.length,
            count: ratings.length,
          };
        });
      }
    }

    const merged: ProviderWithMeta[] = data.map((p) => ({
      ...(p as Profile),
      avgRating: reviewsMap[p.id]?.avg ?? 0,
      reviewsCount: reviewsMap[p.id]?.count ?? 0,
    }));

    setProviders(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const filtered = useMemo(() => {
    let list = providers;
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.service_category === categoryFilter);
    }
    if (governorateFilter !== 'all') {
      list = list.filter((p) => p.governorate === governorateFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.bio ?? '').toLowerCase().includes(q) ||
        getCategoryName(p.service_category ?? '').toLowerCase().includes(q)
      );
    }
    // Sort by rating (desc), then by reviews count
    return [...list].sort((a, b) => {
      const ra = a.avgRating ?? 0;
      const rb = b.avgRating ?? 0;
      if (rb !== ra) return rb - ra;
      return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
    });
  }, [providers, categoryFilter, governorateFilter, search]);

  const hasActiveFilters = categoryFilter !== 'all' || governorateFilter !== 'all' || search.trim();

  return (
    <div className="flex flex-col h-full">
      {/* Search + filter header */}
      <div className="px-4 pt-3 pb-2 space-y-2.5 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن خدمة أو مهندس أو فني…"
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
            onClick={loadProviders}
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
                {Array.from(new Set(providers.map((p) => p.governorate))).map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="p-4 space-y-3 pb-8">
          {loading ? (
            <LoadingList />
          ) : filtered.length === 0 ? (
            <EmptyState
              hasFilters={!!hasActiveFilters}
              onReset={() => {
                setCategoryFilter('all');
                setGovernorateFilter('all');
                setSearch('');
              }}
            />
          ) : (
            <>
              <div className="text-xs text-muted-foreground px-1">
                {filtered.length} مقدم خدمة
              </div>
              {filtered.map((p) => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  rating={p.avgRating}
                  reviewsCount={p.reviewsCount}
                  onClick={() => onOpenProvider(p)}
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
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
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
      <p className="text-sm font-medium text-foreground">لا توجد نتائج</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
        {hasFilters
          ? 'جرّب تعديل الفلاتر أو كلمة البحث'
          : 'لم يتم تسجيل أي مقدمي خدمات بعد'}
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
