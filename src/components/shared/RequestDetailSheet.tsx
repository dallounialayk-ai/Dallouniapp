'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MapPin, MessageCircle, Phone, Flag, Share2, Clock, Tag,
  X, Send, CheckCircle2, ChevronLeft, CircleDollarSign,
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
import { supabase, type ServiceRequest, type Profile, type Offer } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { getCategoryName } from '@/lib/constants';
import { getInitials, formatRelativeTime, formatCurrency } from '@/lib/utils';

export function RequestDetailSheet({
  request, requestOwner, open, onOpenChange, onOpenChat, onOfferSubmitted,
}: {
  request: ServiceRequest | null;
  requestOwner?: Profile | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenChat: (peer: Profile) => void;
  onOfferSubmitted?: () => void;
}) {
  const { profile } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportComment, setReportComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadOffers = useCallback(async () => {
    if (!request) return;
    const { data } = await supabase
      .from('offers')
      .select('*, profile:profiles!provider_id(*)')
      .eq('request_id', request.id)
      .order('created_at', { ascending: false });
    setOffers((data ?? []) as Offer[]);
  }, [request]);

  useEffect(() => {
    if (open && request) loadOffers();
  }, [open, request, loadOffers]);

  if (!request) return null;

  const isOwner = profile?.id === request.user_id;
  const myOffer = offers.find((o) => o.provider_id === profile?.id);

  const handleShare = async () => {
    const shareData = {
      title: request.title,
      text: `طلب خدمة: ${request.title} — ${request.description}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
        toast.success('تم نسخ تفاصيل الطلب');
      }
    } catch {}
  };

  const handleWhatsapp = (whatsappNumber: string, name: string) => {
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    let formattedNumber = cleanNumber;
    if (cleanNumber.startsWith('7') && cleanNumber.length === 9) {
      formattedNumber = '967' + cleanNumber;
    } else if (cleanNumber.startsWith('00967')) {
      formattedNumber = cleanNumber.replace('00967', '967');
    }
    const message = encodeURIComponent(`السلام عليكم، تواصل معك عبر تطبيق دلّوني عليك بخصوص طلبك "${request.title}"`);
    window.open(`https://wa.me/${formattedNumber}?text=${message}`, '_blank');
  };

  const handleSubmitOffer = async () => {
    if (!profile || !request) return;
    if (profile.role !== 'provider') {
      toast.error('فقط أصحاب الخدمات يمكنهم تقديم العروض');
      return;
    }
    if (profile.id === request.user_id) {
      toast.error('لا يمكنك تقديم عرض على طلبك');
      return;
    }
    if (!offerMessage.trim()) {
      toast.error('الرجاء كتابة نص العرض');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('offers').upsert({
      request_id: request.id,
      provider_id: profile.id,
      price: offerPrice ? parseFloat(offerPrice) : null,
      message: offerMessage,
      status: 'pending',
    }, { onConflict: 'request_id,provider_id' });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Notify the request owner
    await supabase.from('notifications').insert({
      user_id: request.user_id,
      type: 'offer',
      title: 'عرض سعر جديد',
      body: `${profile.full_name} قدّم عرضًا على طلبك "${request.title}"`,
      data: { request_id: request.id },
    });

    toast.success('تم تقديم عرضك بنجاح');
    setOfferOpen(false);
    setOfferPrice('');
    setOfferMessage('');
    setSubmitting(false);
    loadOffers();
    onOfferSubmitted?.();
  };

  const handleAcceptOffer = async (offer: Offer) => {
    const { error } = await supabase
      .from('offers')
      .update({ status: 'accepted' })
      .eq('id', offer.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from('notifications').insert({
      user_id: offer.provider_id,
      type: 'offer_accepted',
      title: 'تم قبول عرضك',
      body: `تم قبول عرضك على الطلب "${request?.title}"`,
      data: { request_id: request?.id },
    });
    toast.success('تم قبول العرض');
    loadOffers();
  };

  const handleRejectOffer = async (offer: Offer) => {
    const { error } = await supabase
      .from('offers')
      .update({ status: 'rejected' })
      .eq('id', offer.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('تم رفض العرض');
    loadOffers();
  };

  const handleSubmitReport = async () => {
    if (!profile || !request) return;
    if (!reportReason.trim()) {
      toast.error('الرجاء كتابة سبب البلاغ');
      return;
    }
    const { error } = await supabase.from('reports').insert({
      reporter_id: profile.id,
      reported_id: request.user_id,
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
          className="h-[92vh] max-h-[92vh] p-0 rounded-t-3xl flex flex-col"
        >
          <SheetHeader className="px-5 pt-4 pb-3 border-b border-border/40 shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-bold">تفاصيل الطلب</SheetTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SheetDescription className="sr-only">عرض تفاصيل الطلب</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-overlay min-h-0">
            <div className="p-5 space-y-5">
              {/* Title and meta */}
              <div>
                <h2 className="text-xl font-bold leading-tight">{request.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <Badge variant="secondary" className="font-medium flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    {getCategoryName(request.category)}
                  </Badge>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-2.5 h-2.5" />
                    {request.governorate}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {formatRelativeTime(request.created_at)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-2">وصف الخدمة</h3>
                <div className="bg-muted/40 rounded-2xl p-3.5 text-sm leading-relaxed whitespace-pre-wrap">
                  {request.description}
                </div>
              </div>

              {/* Owner info */}
              {requestOwner && (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground mb-2">صاحب الطلب</h3>
                  <div className="bg-card border border-border/60 rounded-2xl p-3 flex items-center gap-3 elevate-1">
                    <Avatar className="w-11 h-11 rounded-xl">
                      <AvatarImage src={requestOwner.avatar_url ?? undefined} />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
                        {getInitials(requestOwner.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{requestOwner.full_name}</div>
                      <div className="text-xs text-muted-foreground">{requestOwner.governorate}</div>
                    </div>
                    {!isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenChat(requestOwner)}
                        className="h-9 rounded-xl"
                      >
                        <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
                        مراسلة
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isOwner && (
                <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setOfferOpen(true)}
                    className="h-11 rounded-xl font-semibold"
                    disabled={profile?.role !== 'provider'}
                  >
                    <CircleDollarSign className="w-4 h-4 ml-1.5" />
                    {myOffer ? 'تعديل العرض' : 'تقديم عرض سعر'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => requestOwner && onOpenChat(requestOwner)}
                    className="h-11 rounded-xl font-semibold"
                    disabled={!requestOwner}
                  >
                    <MessageCircle className="w-4 h-4 ml-1.5" />
                    مراسلة
                  </Button>
                </div>

                {requestOwner?.whatsapp_number && (
                  <Button
                    variant="outline"
                    onClick={() => handleWhatsapp(requestOwner.whatsapp_number!, requestOwner.full_name)}
                    className="h-11 rounded-xl font-semibold w-full text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <WhatsappIcon className="w-4 h-4 ml-2" />
                    مراسلة عبر واتساب
                  </Button>
                )}
                </>
              )}

              {isOwner && requestOwner && (
                <Button
                  variant="outline"
                  onClick={() => onOpenChat(requestOwner)}
                  className="h-11 rounded-xl font-semibold w-full"
                >
                  <Phone className="w-4 h-4 ml-2" />
                  اتصال بصاحب الطلب
                </Button>
              )}

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
                  disabled={isOwner}
                >
                  <Flag className="w-3.5 h-3.5 ml-1.5" />
                  بلاغ
                </Button>
              </div>

              {/* Offers list */}
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-2">
                  العروض المقدّمة ({offers.length})
                </h3>
                {offers.length === 0 ? (
                  <div className="bg-muted/40 rounded-2xl p-6 text-center text-sm text-muted-foreground">
                    <CircleDollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    لا توجد عروض بعد
                  </div>
                ) : (
                  <div className="space-y-2">
                    {offers.map((o) => (
                      <OfferCard
                        key={o.id}
                        offer={o}
                        isOwner={isOwner}
                        onAccept={() => handleAcceptOffer(o)}
                        onReject={() => handleRejectOffer(o)}
                        onChat={() => o.profile && onOpenChat(o.profile)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Offer dialog */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">
              {myOffer ? 'تعديل العرض' : 'تقديم عرض سعر'}
            </DialogTitle>
            <DialogDescription className="text-right">
              سيظهر عرضك لصاحب الطلب وللمستخدمين الآخرين
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">السعر (ريال يمني) — اختياري</Label>
              <Input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="مثال: 500000"
                className="mt-1 h-11 rounded-xl bg-muted/40"
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-xs">نص العرض *</Label>
              <Textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="اكتب تفاصيل عرضك: المدة، المواد، الضمانات…"
                rows={4}
                className="mt-1 rounded-xl bg-muted/40 resize-none text-sm"
              />
            </div>
            <Button
              onClick={handleSubmitOffer}
              disabled={submitting}
              className="w-full h-11 rounded-xl font-semibold"
            >
              {submitting ? 'جاري الإرسال…' : 'إرسال العرض'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">إبلاغ عن الطلب</DialogTitle>
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

function OfferCard({
  offer, isOwner, onAccept, onReject, onChat,
}: {
  offer: Offer;
  isOwner: boolean;
  onAccept: () => void;
  onReject: () => void;
  onChat: () => void;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-3 elevate-1">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 rounded-xl shrink-0">
          <AvatarImage src={offer.profile?.avatar_url ?? undefined} />
          <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xs">
            {getInitials(offer.profile?.full_name ?? '؟')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-sm truncate">{offer.profile?.full_name}</div>
            {offer.price && (
              <div className="text-primary font-bold text-sm shrink-0">
                {formatCurrency(offer.price)}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3 mt-1 leading-relaxed">
            {offer.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={
                offer.status === 'accepted' ? 'default' :
                offer.status === 'rejected' ? 'destructive' : 'secondary'
              }
              className="text-[10px]"
            >
              {offer.status === 'accepted' ? 'مقبول' :
               offer.status === 'rejected' ? 'مرفوض' : 'بانتظار'}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatRelativeTime(offer.created_at)}
            </span>
          </div>
          {isOwner && offer.status === 'pending' && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={onAccept}
                className="h-8 rounded-lg flex-1 text-xs"
              >
                <CheckCircle2 className="w-3 h-3 ml-1" />
                قبول
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                className="h-8 rounded-lg flex-1 text-xs"
              >
                رفض
              </Button>
            </div>
          )}
          {isOwner && offer.status !== 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onChat}
              className="h-8 rounded-lg w-full mt-2 text-xs"
            >
              <MessageCircle className="w-3 h-3 ml-1.5" />
              مراسلة
            </Button>
          )}
        </div>
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
