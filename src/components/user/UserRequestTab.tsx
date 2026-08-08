'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, CheckCircle2, Plus, ListChecks, MapPin, Clock,
  Navigation, Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase, type ServiceRequest } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { YEMEN_GOVERNORATES, getCategoryName, getCategoryPath, getCategoryGroupId, getDescendantLeafIds, REQUEST_DEADLINE_OPTIONS, computeExpiresAt, getDeadlineLabel, type RequestDeadlineDays } from '@/lib/constants';
import { ServiceCategoryPicker } from '@/components/shared/ServiceCategoryPicker';
import { formatRelativeTime, formatDeadlineRemaining } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  getCurrentPosition,
  getGovernorateCenter,
  openDeviceLocationSettings,
  reverseGeocode,
  watchVisibilityAndLocate,
  type LatLng,
} from '@/lib/geo';
import { LocationEnableDialog } from '@/components/shared/LocationEnableDialog';
import { LocationPreviewMap } from '@/components/shared/ProvidersMapDynamic';

export function UserRequestTab({
  onOpenRequest,
  refreshKey,
}: {
  onOpenRequest: (r: ServiceRequest) => void;
  refreshKey?: number;
}) {
  const { profile } = useAuth();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [governorate, setGovernorate] = useState(profile?.governorate ?? '');
  const [deadlineDays, setDeadlineDays] = useState<RequestDeadlineDays | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showList, setShowList] = useState(false);

  const [location, setLocation] = useState<LatLng | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'ok' | 'pending' | 'denied'>('idle');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const locationWatchCleanup = useRef<(() => void) | null>(null);
  const didInitGov = useRef(false);

  useEffect(() => {
    if (showList && refreshKey !== undefined) {
      loadMyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const applyExactLocation = useCallback(async (coords: LatLng, gov: string) => {
    setLocation(coords);
    setLocationStatus('ok');
    setShowLocationDialog(false);
    const label = await reverseGeocode(coords.lat, coords.lng, gov);
    setLocationLabel(label);
  }, []);

  const captureLocation = useCallback(async (gov: string) => {
    if (!gov) return;
    setLocating(true);
    setLocationStatus('pending');
    const result = await getCurrentPosition({ maximumAge: 0 });
    setLocating(false);
    if (result.ok) {
      await applyExactLocation(result.coords, gov);
      return;
    }
    const center = getGovernorateCenter(gov);
    setLocation({ lat: center.lat, lng: center.lng });
    setLocationLabel(gov);
    setLocationStatus(result.code === 'denied' || result.code === 'unavailable' ? 'denied' : 'pending');
    setShowLocationDialog(true);
  }, [applyExactLocation]);

  // سحب الموقع تلقائيًا إن كانت المحافظة مملوءة من الملف الشخصي
  useEffect(() => {
    if (didInitGov.current) return;
    if (!governorate) return;
    didInitGov.current = true;
    void captureLocation(governorate);
  }, [governorate, captureLocation]);

  const handleGovernorateChange = (gov: string) => {
    setGovernorate(gov);
    void captureLocation(gov);
  };

  const handleEnableLocation = () => {
    openDeviceLocationSettings();
    locationWatchCleanup.current?.();
    locationWatchCleanup.current = watchVisibilityAndLocate((result) => {
      if (result.ok && governorate) {
        void applyExactLocation(result.coords, governorate);
      }
    });
    void getCurrentPosition({ maximumAge: 0 }).then((result) => {
      if (result.ok && governorate) {
        void applyExactLocation(result.coords, governorate);
        locationWatchCleanup.current?.();
        locationWatchCleanup.current = null;
      }
    });
  };

  useEffect(() => {
    return () => {
      locationWatchCleanup.current?.();
    };
  }, []);

  const loadMyRequests = async () => {
    if (!profile) return;
    setLoadingList(true);
    const { data } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setMyRequests((data ?? []) as ServiceRequest[]);
    setLoadingList(false);
  };

  const handleSubmit = async () => {
    if (!profile) return;
    if (!category) {
      toast.error('الرجاء اختيار نوع الخدمة');
      return;
    }
    if (!title.trim()) {
      toast.error('الرجاء إدخال اسم للخدمة');
      return;
    }
    if (!description.trim()) {
      toast.error('الرجاء إدخال وصف للخدمة');
      return;
    }
    if (!governorate) {
      toast.error('الرجاء اختيار المحافظة');
      return;
    }
    if (!deadlineDays) {
      toast.error('الرجاء اختيار مهلة الطلب');
      return;
    }

    let finalLat = location?.lat ?? null;
    let finalLng = location?.lng ?? null;
    let finalLabel = locationLabel;

    if (locationStatus !== 'ok') {
      const result = await getCurrentPosition({ maximumAge: 0 });
      if (result.ok) {
        finalLat = result.coords.lat;
        finalLng = result.coords.lng;
        finalLabel = await reverseGeocode(finalLat, finalLng, governorate);
        setLocation(result.coords);
        setLocationLabel(finalLabel);
        setLocationStatus('ok');
      } else if (!finalLat || !finalLng) {
        const center = getGovernorateCenter(governorate);
        finalLat = center.lat;
        finalLng = center.lng;
        finalLabel = governorate;
      }
    }

    setSubmitting(true);
    const now = new Date();
    const expiresAt = computeExpiresAt(now, deadlineDays);
    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        user_id: profile.id,
        category,
        title: title.trim(),
        description: description.trim(),
        governorate,
        latitude: finalLat,
        longitude: finalLng,
        location_label: finalLabel,
        deadline_days: deadlineDays,
        expires_at: expiresAt.toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    const groupId = getCategoryGroupId(category);
    const relatedCategories = groupId
      ? Array.from(new Set([...getDescendantLeafIds(groupId), category]))
      : [category];

    const { data: providers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'provider')
      .in('service_category', relatedCategories);
    if (providers && providers.length > 0) {
      const providerIds = providers.map((p) => p.id);
      await supabase.rpc('create_notifications_batch', {
        p_user_ids: providerIds,
        p_type: 'new_request',
        p_title: 'طلب خدمة جديد في مجالك',
        p_body: `${title.trim()} — ${governorate}`,
        p_data: { request_id: (data as ServiceRequest).id },
      });
    }

    toast.success('تم نشر طلبك بنجاح، ستصلك العروض قريبًا');
    setCategory('');
    setTitle('');
    setDescription('');
    setDeadlineDays('');
    setSubmitting(false);
    if (showList) loadMyRequests();
  };

  const mapCenter = location ?? (governorate ? getGovernorateCenter(governorate) : null);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 shrink-0 flex items-center justify-between">
        <h2 className="text-base font-bold">طلب خدمة جديدة</h2>
        <Button
          variant={showList ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const v = !showList;
            setShowList(v);
            if (v) loadMyRequests();
          }}
          className="h-9 rounded-xl text-xs font-medium"
        >
          <ListChecks className="w-3.5 h-3.5 ml-1.5" />
          {showList ? 'إخفاء طلباتي' : 'طلباتي'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="p-4 pb-8">
          {showList ? (
            <div className="space-y-3">
              {loadingList ? (
                <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل…</p>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
                    <ListChecks className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">لا توجد طلبات بعد</p>
                  <p className="text-xs text-muted-foreground mt-1">أنشئ طلبك الأول</p>
                </div>
              ) : (
                myRequests.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onOpenRequest(r)}
                    className="w-full text-right bg-card rounded-2xl p-3.5 border border-border/60 elevate-1 hover:elevate-2 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm flex-1">{r.title}</h3>
                      <Badge variant={r.status === 'open' ? 'default' : 'secondary'} className="text-[10px]">
                        {r.status === 'open' ? 'مفتوح' : 'مغلق'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {getCategoryPath(r.category)}
                      </Badge>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {r.location_label || r.governorate}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(r.created_at)}
                      </span>
                      {r.expires_at && (
                        <span className="flex items-center gap-0.5 text-sky-700 font-medium">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDeadlineRemaining(r.expires_at)?.text ?? getDeadlineLabel(r.deadline_days)}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-rise">
              <div className="bg-gradient-to-br from-primary/10 to-accent/30 rounded-2xl p-4 border border-primary/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">أنشئ طلب خدمة</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      املأ التفاصيل وسيظهر طلبك لجميع مقدمي الخدمات المناسبين في مجالك
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">نوع الخدمة *</Label>
                <div className="mt-1">
                  <ServiceCategoryPicker
                    value={category}
                    onChange={setCategory}
                    mode="select"
                    placeholder="اختر التصنيف ثم التخصص"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">اسم الخدمة *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: بناء سور أرضي 200م"
                  className="mt-1 h-12 rounded-xl bg-muted/40 border-border/60"
                  maxLength={80}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">وصف الخدمة *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تفاصيل ما تحتاجه: المساحة، المواد، الميزانية التقريبية، الوقت المطلوب…"
                  rows={5}
                  className="mt-1 rounded-xl bg-muted/40 border-border/60 resize-none text-sm"
                  maxLength={1000}
                />
                <div className="text-[10px] text-muted-foreground mt-1 text-left">
                  {description.length}/1000
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">المحافظة *</Label>
                <Select value={governorate} onValueChange={handleGovernorateChange}>
                  <SelectTrigger className="mt-1 h-12 rounded-xl bg-muted/40 border-border/60">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {YEMEN_GOVERNORATES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">مهلة الطلب *</Label>
                <Select
                  value={deadlineDays === '' ? undefined : String(deadlineDays)}
                  onValueChange={(v) => setDeadlineDays(Number(v) as RequestDeadlineDays)}
                >
                  <SelectTrigger className="mt-1 h-12 rounded-xl bg-muted/40 border-border/60">
                    <SelectValue placeholder="اختر مدة بقاء الطلب مفتوحاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_DEADLINE_OPTIONS.map((o) => (
                      <SelectItem key={o.days} value={String(o.days)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                  عند انتهاء المهلة يُغلق الطلب تلقائياً ويخرج من قائمة الطلبات المفتوحة.
                </p>
              </div>

              {governorate && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Navigation className="w-3.5 h-3.5 text-primary" />
                      موقع البناء / الخدمة
                    </div>
                    {locating ? (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        جاري التحديد…
                      </span>
                    ) : locationStatus === 'ok' ? (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        تم تحديد الموقع
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void captureLocation(governorate)}
                        className="text-[11px] text-primary font-semibold"
                      >
                        إعادة المحاولة
                      </button>
                    )}
                  </div>
                  {mapCenter && (
                    <LocationPreviewMap
                      location={mapCenter}
                      zoom={locationStatus === 'ok' ? 15 : getGovernorateCenter(governorate).zoom}
                    />
                  )}
                  {locationLabel && locationStatus === 'ok' && (
                    <p className="text-[11px] text-muted-foreground px-0.5 flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                      <span>{locationLabel}</span>
                    </p>
                  )}
                  {locationStatus === 'denied' && (
                    <button
                      type="button"
                      onClick={() => setShowLocationDialog(true)}
                      className="w-full text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-right"
                    >
                      الموقع غير مفعّل — اضغط لتفعيله وتحديد مكان البناء في {governorate}
                    </button>
                  )}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 rounded-xl text-base font-semibold elevate-1"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin ml-2" />
                    جاري النشر…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    نشر الطلب
                  </>
                )}
              </Button>

              <div className="bg-muted/30 rounded-2xl p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  بمجرد النشر، سيتلقّى جميع مقدمي الخدمات في هذا المجال إشعارًا بطلبك، ويمكنك متابعة العروض الواردة من تبويب الملف الشخصي.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <LocationEnableDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        governorate={governorate || 'المحافظة المختارة'}
        onEnable={handleEnableLocation}
      />
    </div>
  );
}
