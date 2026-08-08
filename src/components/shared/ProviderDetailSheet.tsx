'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Star, MapPin, MessageCircle, Phone, Flag, Share2,
  Briefcase, X, Send, ChevronLeft, Image as ImageIcon,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase, type Profile, type CatalogItem, type Message, type Review } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { getCategoryPath, isBuildingMaterialsProvider } from '@/lib/constants';
import { getInitials, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { fetchProviderVerification } from '@/lib/verification';

export function ProviderDetailSheet({
  provider, open, onOpenChange, onOpenChat,
}: {
  provider: Profile | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenChat: (provider: Profile) => void;
}) {
  const { profile } = useAuth();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportComment, setReportComment] = useState('');
  const [verified, setVerified] = useState(false);

  const loadData = useCallback(async () => {
    if (!provider) return;
    const [catRes, revRes, verification] = await Promise.all([
      supabase
        .from('catalog_items')
        .select('*')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('*, profile:profiles!reviewer_id(*)')
        .eq('reviewed_id', provider.id)
        .eq('review_type', 'provider')
        .order('created_at', { ascending: false }),
      fetchProviderVerification(provider.id, provider.admin_verified),
    ]);
    setCatalog(catRes.data ?? []);
    const revs = (revRes.data ?? []) as Review[];
    setReviews(revs);
    setVerified(verification.verified);
    if (revs.length > 0) {
      const sum = revs.reduce((s, r) => s + r.rating, 0);
      setAvgRating(sum / revs.length);
    } else {
      setAvgRating(0);
    }
  }, [provider]);

  useEffect(() => {
    if (open && provider) loadData();
  }, [open, provider, loadData]);

  if (!provider) return null;

  const isMaterialsProvider = isBuildingMaterialsProvider(provider.service_category);

  const handleCall = () => {
    if (!provider?.phone) return;
    window.location.href = `tel:${provider.phone}`;
  };

  const handleWhatsapp = (whatsappNumber: string, name: string) => {
    // تنظيف الرقم من المسافات والرموز غير الرقمية
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    // إضافة رمز اليمن (967) إذا كان الرقم يبدأ بـ 7
    let formattedNumber = cleanNumber;
    if (cleanNumber.startsWith('7') && cleanNumber.length === 9) {
      formattedNumber = '967' + cleanNumber;
    } else if (cleanNumber.startsWith('00967')) {
      formattedNumber = cleanNumber.replace('00967', '967');
    }
    const message = encodeURIComponent(`السلام عليكم، تواصل معك عبر تطبيق دلّوني عليك بخصوص ${name}`);
    window.open(`https://wa.me/${formattedNumber}?text=${message}`, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: `${provider.full_name} — ${getCategoryPath(provider.service_category ?? '')}`,
      text: `تعرف على ${provider.full_name} على تطبيق دلّوني عليك`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title} — ${shareData.url}`);
        toast.success('تم نسخ معلومات مقدم الخدمة');
      }
    } catch {}
  };

  const handleSubmitReview = async () => {
    if (!profile) return;
    if (rating === 0) {
      toast.error('الرجاء اختيار تقييم من 1 إلى 5');
      return;
    }
    if (profile.id === provider.id) {
      toast.error('لا يمكنك تقييم نفسك');
      return;
    }
    const { error } = await supabase
      .from('reviews')
      .upsert({
        reviewer_id: profile.id,
        reviewed_id: provider.id,
        rating,
        comment: reviewComment,
        review_type: 'provider',
        reference_id: provider.id,
      }, { onConflict: 'reviewer_id,reviewed_id,review_type,reference_id' });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('تم إرسال تقييمك');
    setRating(0);
    setReviewComment('');
    loadData();
  };

  const handleSubmitReport = async () => {
    if (!profile || !provider) return;
    if (!reportReason.trim()) {
      toast.error('الرجاء كتابة سبب البلاغ');
      return;
    }
    const { error } = await supabase.from('reports').insert({
      reporter_id: profile.id,
      reported_id: provider.id,
      reason: reportReason,
      comment: reportComment,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('تم إرسال البلاغ، شكرًا لك');
    setReportOpen(false);
    setReportReason('');
    setReportComment('');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[92%] max-h-[92%] p-0 rounded-t-3xl flex flex-col"
        >
          <SheetHeader className="px-5 pt-4 pb-3 border-b border-border/40 shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-bold">تفاصيل مقدم الخدمة</SheetTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SheetDescription className="sr-only">عرض تفاصيل مقدم الخدمة</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-overlay min-h-0">
            <div className="p-5 space-y-5">
              {/* Header */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 rounded-3xl border-2 border-border/40 elevate-1">
                  <AvatarImage src={provider.avatar_url ?? undefined} />
                  <AvatarFallback className="rounded-3xl bg-gradient-to-br from-primary/20 to-accent text-primary font-bold text-2xl">
                    {getInitials(provider.full_name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold mt-3 inline-flex items-center justify-center gap-1.5">
                  {provider.full_name}
                  <VerifiedBadge verified={verified} size="lg" />
                </h2>
                <Badge variant="secondary" className="mt-1.5 font-medium">
                  <Briefcase className="w-3 h-3 ml-1" />
                  {getCategoryPath(provider.service_category ?? '')}
                </Badge>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {provider.governorate}
                  </span>
                  {reviews.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {avgRating.toFixed(1)} ({reviews.length})
                    </span>
                  )}
                </div>
              </div>

              {/* Bio */}
              {provider.bio && (
                <Section title="نبذة">
                  <p className="text-sm leading-relaxed text-foreground/90">{provider.bio}</p>
                </Section>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => onOpenChat(provider)}
                  className="h-11 rounded-xl font-semibold"
                  disabled={profile?.id === provider.id}
                >
                  <MessageCircle className="w-4 h-4 ml-1.5" />
                  مراسلة
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCall}
                  className="h-11 rounded-xl font-semibold"
                >
                  <Phone className="w-4 h-4 ml-1.5" />
                  اتصال
                </Button>
                {provider.whatsapp_number && provider.whatsapp_number.trim() !== '' && (
                  <Button
                    variant="outline"
                    onClick={() => handleWhatsapp(provider.whatsapp_number!, provider.full_name)}
                    className="h-11 rounded-xl font-semibold text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <WhatsappIcon className="w-4 h-4 ml-1.5" />
                    واتساب
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="h-10 rounded-xl text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 ml-1.5" />
                  مشاركة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportOpen(true)}
                  className="h-10 rounded-xl text-xs text-destructive hover:text-destructive"
                  disabled={profile?.id === provider.id}
                >
                  <Flag className="w-3.5 h-3.5 ml-1.5" />
                  بلاغ
                </Button>
              </div>

              {/* Catalog */}
              {catalog.length > 0 && (
                <Section title={isMaterialsProvider ? `الأصناف المتوفرة (${catalog.length})` : `أعمال سابقة (${catalog.length})`}>
                  <div className={isMaterialsProvider ? "grid grid-cols-2 gap-3" : "grid grid-cols-3 gap-2"}>
                    {catalog.map((c) => (
                      <CatalogThumb key={c.id} item={c} showPrice={isMaterialsProvider} />
                    ))}
                  </div>
                </Section>
              )}

              {/* Reviews */}
              <Section title={`التقييمات (${reviews.length})`}>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد تقييمات بعد
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {reviews.map((r) => (
                      <ReviewBubble key={r.id} review={r} />
                    ))}
                  </div>
                )}
              </Section>

              {/* Add review */}
              {profile && profile.id !== provider.id && (
                <Section title="أضف تقييمك">
                  <div className="space-y-3">
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setRating(n)}
                          className="p-1"
                        >
                          <Star
                            className={`w-7 h-7 transition-all ${
                              n <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/40 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="اكتب تعليقك (اختياري)…"
                      rows={3}
                      className="rounded-xl bg-muted/40 border-border/60 resize-none text-sm"
                    />
                    <Button
                      onClick={handleSubmitReview}
                      className="w-full h-11 rounded-xl font-semibold"
                    >
                      إرسال التقييم
                    </Button>
                  </div>
                </Section>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">إبلاغ عن مقدم الخدمة</DialogTitle>
            <DialogDescription className="text-right">
              سيراجع فريقنا البلاغ ويتخذ الإجراء المناسب
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">سبب البلاغ *</Label>
              <Input
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="مثال: محتوى مخالف، احتيال، …"
                className="mt-1 h-11 rounded-xl bg-muted/40"
              />
            </div>
            <div>
              <Label className="text-xs">تفاصيل إضافية</Label>
              <Textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                rows={3}
                className="mt-1 rounded-xl bg-muted/40 resize-none text-sm"
              />
            </div>
            <Button
              onClick={handleSubmitReport}
              className="w-full h-11 rounded-xl bg-destructive hover:bg-destructive/90"
            >
              إرسال البلاغ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-muted-foreground mb-2 px-1">{title}</h3>
      {children}
    </div>
  );
}

function CatalogThumb({ item, showPrice = false }: { item: CatalogItem; showPrice?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-xl overflow-hidden bg-muted/40 elevate-1 hover:elevate-2 transition-all text-right w-full"
      >
        <div className={showPrice ? "aspect-square" : "aspect-square"}>
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {showPrice && item.price != null && (
            <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full px-1.5 py-0.5 shadow-md">
              {formatCurrency(item.price)}
            </div>
          )}
        </div>
        {showPrice && (
          <div className="p-1.5 bg-card">
            <div className="font-semibold text-[10px] truncate leading-tight">{item.title}</div>
            {item.price != null && (
              <div className="text-primary font-bold text-[10px] mt-0.5 flex items-center gap-0.5">
                {formatCurrency(item.price)}
                {item.unit && (
                  <span className="text-muted-foreground font-normal text-[9px]">/ {item.unit}</span>
                )}
              </div>
            )}
          </div>
        )}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-right">{item.title}</DialogTitle>
            {item.description && (
              <DialogDescription className="text-right">{item.description}</DialogDescription>
            )}
            {showPrice && item.price != null && (
              <div className="text-right mt-2">
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-bold text-sm rounded-full px-3 py-1">
                  {formatCurrency(item.price)}
                  {item.unit && <span className="font-normal text-xs">/ {item.unit}</span>}
                </span>
              </div>
            )}
          </DialogHeader>
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full rounded-2xl max-h-[60vh] object-cover"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReviewBubble({ review }: { review: Review }) {
  return (
    <div className="bg-muted/40 rounded-2xl p-3 text-right">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7 rounded-lg">
            <AvatarImage src={review.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-[10px] font-bold">
              {getInitials(review.profile?.full_name ?? '؟')}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold">{review.profile?.full_name}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`w-3 h-3 ${
                n <= review.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>
      )}
      <div className="text-[10px] text-muted-foreground/70 mt-1">
        {formatRelativeTime(review.created_at)}
      </div>
    </div>
  );
}

/**
 * أيقونة واتساب — SVG inline بألوان واتساب الرسمية
 */
function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
