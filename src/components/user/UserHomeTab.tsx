'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal, X, RefreshCw, MapPinned, List, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase, type Profile } from '@/lib/supabase';
import { getCategoryName, getCategoryPath, matchesCategoryFilter } from '@/lib/constants';
import { ServiceCategoryPicker } from '@/components/shared/ServiceCategoryPicker';
import { ProviderCard } from '@/components/shared/ProviderCard';
import { ProvidersMap } from '@/components/shared/ProvidersMapDynamic';
import { LocationEnableDialog } from '@/components/shared/LocationEnableDialog';
import { useAuth } from '@/store/auth';
import {
  computeVerification,
  fetchVerificationStatsMap,
} from '@/lib/verification';
import {
  distanceKm,
  getCurrentPosition,
  getGovernorateCenter,
  isValidCoords,
  NEARBY_RADIUS_KM,
  openDeviceLocationSettings,
  watchVisibilityAndLocate,
  type LatLng,
} from '@/lib/geo';

type ProviderWithMeta = Profile & {
  avgRating?: number;
  reviewsCount?: number;
  distanceKm?: number;
  verified?: boolean;
};

export function UserHomeTab({
  onOpenProvider,
}: {
  onOpenProvider: (p: Profile) => void;
}) {
  const { profile, updateProfile } = useAuth();
  const [providers, setProviders] = useState<ProviderWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | '4' | '3' | '2'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const resetFilters = () => {
    setCategoryFilter('all');
    setGovernorateFilter('all');
    setVerifiedFilter('all');
    setRatingFilter('all');
    setSearch('');
  };
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showNearbyMap, setShowNearbyMap] = useState(false);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'provider')
      .neq('is_blocked', true)
      .neq('is_approved', false)
      .order('created_at', { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    const providerIds = data.map((p) => p.id);
    let reviewsMap: Record<string, { avg: number; count: number }> = {};
    let verificationMap = await fetchVerificationStatsMap(providerIds);

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

    const merged: ProviderWithMeta[] = data.map((p) => {
      const profile = p as Profile;
      const avgFromReviews = reviewsMap[p.id]?.avg ?? 0;
      const count = reviewsMap[p.id]?.count ?? 0;
      const override =
        typeof profile.rating_override === 'number' ? profile.rating_override : null;
      const verification = computeVerification(
        profile.admin_verified,
        verificationMap[p.id] ?? {
          offersCount: 0,
          highReviewsCount: 0,
          reportsCount: 0,
        }
      );
      return {
        ...profile,
        avgRating: override != null ? override : avgFromReviews,
        reviewsCount: override != null && count === 0 ? 1 : count,
        verified: verification.verified,
      };
    });

    setProviders(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // تهيئة موقع المستخدم من الملف أو GPS
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const initLocation = async () => {
      if (profile && isValidCoords(profile.latitude, profile.longitude)) {
        if (!cancelled) {
          setUserLocation({ lat: profile.latitude!, lng: profile.longitude! });
        }
        return;
      }

      const result = await getCurrentPosition();
      if (cancelled) return;
      if (result.ok) {
        setUserLocation(result.coords);
        if (profile) {
          void updateProfile({
            latitude: result.coords.lat,
            longitude: result.coords.lng,
          });
        }
      }
    };

    void initLocation();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [profile?.id, profile?.latitude, profile?.longitude, updateProfile]);

  const filtered = useMemo(() => {
    let list = providers;
    if (categoryFilter !== 'all') {
      list = list.filter((p) => matchesCategoryFilter(p.service_category, categoryFilter));
    }
    if (governorateFilter !== 'all') {
      list = list.filter((p) => p.governorate === governorateFilter);
    }
    if (verifiedFilter === 'verified') {
      list = list.filter((p) => p.verified);
    } else if (verifiedFilter === 'unverified') {
      list = list.filter((p) => !p.verified);
    }
    if (ratingFilter !== 'all') {
      const min = Number(ratingFilter);
      list = list.filter((p) => (p.avgRating ?? 0) >= min);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.bio ?? '').toLowerCase().includes(q) ||
        getCategoryName(p.service_category ?? '').toLowerCase().includes(q) ||
        getCategoryPath(p.service_category).toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const ra = a.avgRating ?? 0;
      const rb = b.avgRating ?? 0;
      if (rb !== ra) return rb - ra;
      return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
    });
  }, [providers, categoryFilter, governorateFilter, verifiedFilter, ratingFilter, search]);

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    governorateFilter !== 'all' ||
    verifiedFilter !== 'all' ||
    ratingFilter !== 'all' ||
    !!search.trim();

  // عند مسح الفلاتر ارجع من شاشة الخريطة تلقائيًا
  useEffect(() => {
    if (!hasActiveFilters) setShowNearbyMap(false);
  }, [hasActiveFilters]);

  const nearbyProviders = useMemo(() => {
    if (!userLocation) {
      // بدون موقع المستخدم: أظهر من لديهم إحداثيات ضمن نتائج الفلتر
      return filtered
        .filter((p) => isValidCoords(p.latitude, p.longitude))
        .map((p) => ({ ...p }));
    }
    return filtered
      .filter((p) => isValidCoords(p.latitude, p.longitude))
      .map((p) => ({
        ...p,
        distanceKm: distanceKm(userLocation, {
          lat: p.latitude!,
          lng: p.longitude!,
        }),
      }))
      .filter((p) => (p.distanceKm ?? 999) <= NEARBY_RADIUS_KM)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [filtered, userLocation]);

  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation;
    if (governorateFilter !== 'all') return getGovernorateCenter(governorateFilter);
    if (profile?.governorate) return getGovernorateCenter(profile.governorate);
    return getGovernorateCenter('أمانة العاصمة');
  }, [userLocation, governorateFilter, profile?.governorate]);

  const handleEnableLocation = () => {
    openDeviceLocationSettings();
    watchVisibilityAndLocate(async (result) => {
      if (!result.ok) return;
      setUserLocation(result.coords);
      setShowLocationDialog(false);
      if (profile) {
        await updateProfile({
          latitude: result.coords.lat,
          longitude: result.coords.lng,
        });
      }
    });
    void getCurrentPosition({ maximumAge: 0 }).then(async (result) => {
      if (!result.ok) return;
      setUserLocation(result.coords);
      setShowLocationDialog(false);
      if (profile) {
        await updateProfile({
          latitude: result.coords.lat,
          longitude: result.coords.lng,
        });
      }
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 overflow-x-hidden">
      {/* شاشة الخريطة — البحث في الجوار */}
      {showNearbyMap && hasActiveFilters ? (
        <div className="flex flex-col h-full min-h-0">
          <div className="shrink-0 px-3 pt-3 pb-2 flex items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur">
            <button
              type="button"
              onClick={() => setShowNearbyMap(false)}
              className="h-10 px-3 rounded-xl bg-muted/50 hover:bg-muted flex items-center gap-1.5 text-sm font-semibold transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              تراجع
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate flex items-center gap-1.5">
                <MapPinned className="w-4 h-4 text-primary shrink-0" />
                البحث في الجوار
              </div>
              <div className="text-[11px] text-muted-foreground">
                {nearbyProviders.length} مقدم خدمة قريب
                {!userLocation ? ' · فعّل موقعك للدقة' : ''}
              </div>
            </div>
            {!userLocation && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLocationDialog(true)}
                className="h-9 rounded-xl text-xs shrink-0"
              >
                تفعيل الموقع
              </Button>
            )}
          </div>

          <div className="flex-1 min-h-0 p-3 flex flex-col gap-2 overflow-hidden">
            {!userLocation && (
              <button
                type="button"
                onClick={() => setShowLocationDialog(true)}
                className="w-full shrink-0 text-right text-xs rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2.5"
              >
                فعّل موقعك لعرض أصحاب الخدمة الأقرب إليك بدقة
              </button>
            )}
            <div className="flex-1 min-h-0 rounded-2xl overflow-hidden">
              <ProvidersMap
                providers={nearbyProviders}
                userLocation={userLocation}
                center={mapCenter}
                zoom={userLocation ? 13 : 11}
                height="100%"
                onSelectProvider={(p) => onOpenProvider(p)}
              />
            </div>
            {nearbyProviders.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-1 shrink-0">
                لا يوجد مقدمو خدمة بموقع مسجّل ضمن نطاق {NEARBY_RADIUS_KM} كم
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
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
                  onClick={resetFilters}
                  className="h-9 rounded-xl text-xs text-muted-foreground mr-auto"
                >
                  مسح الفلاتر
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
                    {Array.from(new Set(providers.map((p) => p.governorate))).map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={verifiedFilter}
                    onValueChange={(v) =>
                      setVerifiedFilter(v as 'all' | 'verified' | 'unverified')
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/40 text-xs">
                      <SelectValue placeholder="التوثيق" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحسابات</SelectItem>
                      <SelectItem value="verified">موثّقون فقط</SelectItem>
                      <SelectItem value="unverified">غير موثّقين</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={ratingFilter}
                    onValueChange={(v) => setRatingFilter(v as 'all' | '4' | '3' | '2')}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/40 text-xs">
                      <SelectValue placeholder="التقييم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل التقييمات</SelectItem>
                      <SelectItem value="4">4 نجوم فأعلى</SelectItem>
                      <SelectItem value="3">3 نجوم فأعلى</SelectItem>
                      <SelectItem value="2">2 نجوم فأعلى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0 overflow-x-hidden">
            <div className="p-4 space-y-3 pb-8">
              {loading ? (
                <LoadingList />
              ) : filtered.length === 0 ? (
                <EmptyState
                  hasFilters={!!hasActiveFilters}
                  onReset={resetFilters}
                />
              ) : hasActiveFilters ? (
                <>
                  <div className="flex items-center gap-2 px-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <List className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="text-sm font-bold">نتائج البحث</h3>
                      <span className="text-xs text-muted-foreground">
                        ({filtered.length})
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowNearbyMap(true)}
                      className="h-9 rounded-xl text-xs font-semibold mr-auto gap-1.5"
                    >
                      <MapPinned className="w-3.5 h-3.5" />
                      البحث في الجوار
                    </Button>
                  </div>
                  {filtered.map((p) => (
                    <ProviderCard
                      key={p.id}
                      provider={p}
                      rating={p.avgRating}
                      reviewsCount={p.reviewsCount}
                      verified={p.verified}
                      onClick={() => onOpenProvider(p)}
                    />
                  ))}
                </>
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
                      verified={p.verified}
                      onClick={() => onOpenProvider(p)}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}

      <LocationEnableDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        governorate={
          governorateFilter !== 'all'
            ? governorateFilter
            : profile?.governorate || 'منطقتك'
        }
        onEnable={handleEnableLocation}
      />
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
