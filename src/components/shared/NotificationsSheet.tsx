'use client';

import { useEffect } from 'react';
import {
  Bell, X, CheckCheck, Trash2, MessageCircle, CircleDollarSign,
  FileText, Sparkles, BadgeCheck, Flag, Ban, Clock, Star,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase, type AppNotification } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { useNotifications } from '@/store/notifications';
import { formatRelativeTime } from '@/lib/utils';

export type NotificationNavigateTarget =
  | { kind: 'request'; requestId: string }
  | { kind: 'chat'; peerId: string }
  | { kind: 'provider'; providerId: string }
  | { kind: 'profile' }
  | { kind: 'none' };

export function NotificationsSheet({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNavigate?: (target: NotificationNavigateTarget) => void;
}) {
  const { profile } = useAuth();
  const { items, loading, loadItems, markRead, markAllRead, loadUnreadCount } =
    useNotifications();

  useEffect(() => {
    if (open && profile) void loadItems(profile.id);
  }, [open, profile, loadItems]);

  const handleClear = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id);
    if (error) {
      toast.error(error.message || 'تعذّر مسح الإشعارات');
      return;
    }
    await loadItems(profile.id);
    await loadUnreadCount(profile.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80%] max-h-[80%] p-0 rounded-t-3xl flex flex-col"
      >
        <SheetHeader className="px-5 pt-4 pb-3 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <SheetTitle className="text-base font-bold">الإشعارات</SheetTitle>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SheetDescription className="sr-only">عرض الإشعارات</SheetDescription>
        </SheetHeader>

        {items.length > 0 && (
          <div className="px-5 py-2 flex items-center gap-2 border-b border-border/30 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => profile && void markAllRead(profile.id)}
              className="h-8 rounded-lg text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 ml-1.5" />
              تعليم الكل كمقروء
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleClear()}
              className="h-8 rounded-lg text-xs text-destructive hover:text-destructive mr-auto"
            >
              <Trash2 className="w-3.5 h-3.5 ml-1.5" />
              مسح الكل
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-overlay min-h-0">
          <div className="p-4 space-y-2 pb-8">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل…</p>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">لا توجد إشعارات</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ستظهر هنا الرسائل والعروض وتحديثات طلباتك
                </p>
              </div>
            ) : (
              items.map((n) => (
                <NotifRow
                  key={n.id}
                  notif={n}
                  onOpen={async () => {
                    if (!n.read) await markRead(n.id);
                    const target = resolveNavigateTarget(n);
                    onOpenChange(false);
                    onNavigate?.(target);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function NotifBadge() {
  const unreadCount = useNotifications((s) => s.unreadCount);
  if (unreadCount <= 0) return null;
  const label = unreadCount > 99 ? '99+' : String(unreadCount);
  return (
    <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
      {label}
    </span>
  );
}

/** يشغّل الاشتراك والعدّاد + توست عند وصول إشعار جديد */
export function NotificationsBootstrap() {
  const { profile } = useAuth();
  const subscribe = useNotifications((s) => s.subscribe);
  const unsubscribe = useNotifications((s) => s.unsubscribe);

  useEffect(() => {
    if (!profile?.id) {
      unsubscribe();
      return;
    }
    subscribe(profile.id);

    // توست منفصل عبر قناة خفيفة
    const channel = supabase
      .channel(`notif-toast-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const n = payload.new as AppNotification;
          toast(n.title, { description: n.body || undefined });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      unsubscribe();
    };
  }, [profile?.id, subscribe, unsubscribe]);

  return null;
}

function resolveNavigateTarget(n: AppNotification): NotificationNavigateTarget {
  const data = (n.data ?? {}) as Record<string, unknown>;
  const action = String(data.action ?? '');
  const requestId = typeof data.request_id === 'string' ? data.request_id : null;
  const peerId =
    typeof data.from === 'string'
      ? data.from
      : typeof data.peer_id === 'string'
        ? data.peer_id
        : typeof data.provider_id === 'string'
          ? data.provider_id
          : null;
  const providerId = typeof data.provider_id === 'string' ? data.provider_id : null;

  if (action === 'profile' || n.type === 'admin_verified' || n.type === 'auto_verified' || n.type === 'admin_approval') {
    return { kind: 'profile' };
  }
  if (n.type === 'message' && peerId) return { kind: 'chat', peerId };
  if (
    (n.type === 'offer' ||
      n.type === 'offer_accepted' ||
      n.type === 'offer_rejected' ||
      n.type === 'new_request' ||
      n.type === 'request_closed' ||
      n.type === 'request_expired') &&
    requestId
  ) {
    return { kind: 'request', requestId };
  }
  if (providerId && (action === 'provider' || n.type === 'report_resolved')) {
    return { kind: 'provider', providerId };
  }
  if (requestId) return { kind: 'request', requestId };
  if (peerId) return { kind: 'chat', peerId };
  return { kind: 'none' };
}

function NotifRow({
  notif,
  onOpen,
}: {
  notif: AppNotification;
  onOpen: () => void;
}) {
  const { icon, iconBg } = getNotifVisual(notif.type);

  return (
    <button
      onClick={onOpen}
      className={`w-full text-right p-3 rounded-2xl border transition-all flex items-start gap-3 ${
        notif.read
          ? 'bg-card border-border/40'
          : 'bg-primary/[0.03] border-primary/20'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm">{notif.title}</span>
          {!notif.read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 pulse-badge" />
          )}
        </div>
        {notif.body && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.body}</p>
        )}
        <div className="text-[10px] text-muted-foreground/70 mt-1">
          {formatRelativeTime(notif.created_at)}
        </div>
      </div>
    </button>
  );
}

function getNotifVisual(type: string) {
  switch (type) {
    case 'message':
      return { icon: <MessageCircle className="w-4 h-4" />, iconBg: 'bg-sky-100 text-sky-700' };
    case 'offer':
    case 'offer_accepted':
      return { icon: <CircleDollarSign className="w-4 h-4" />, iconBg: 'bg-emerald-100 text-emerald-700' };
    case 'offer_rejected':
      return { icon: <CircleDollarSign className="w-4 h-4" />, iconBg: 'bg-red-100 text-red-700' };
    case 'new_request':
      return { icon: <FileText className="w-4 h-4" />, iconBg: 'bg-amber-100 text-amber-800' };
    case 'request_expired':
    case 'request_closed':
      return { icon: <Clock className="w-4 h-4" />, iconBg: 'bg-orange-100 text-orange-800' };
    case 'admin_verified':
    case 'auto_verified':
      return { icon: <BadgeCheck className="w-4 h-4" />, iconBg: 'bg-sky-100 text-[#1D9BF0]' };
    case 'admin_blocked':
    case 'admin_unapproved':
      return { icon: <Ban className="w-4 h-4" />, iconBg: 'bg-red-100 text-red-700' };
    case 'report_received':
    case 'report_resolved':
      return { icon: <Flag className="w-4 h-4" />, iconBg: 'bg-rose-100 text-rose-700' };
    case 'rating_updated':
      return { icon: <Star className="w-4 h-4" />, iconBg: 'bg-amber-100 text-amber-700' };
    default:
      return { icon: <Sparkles className="w-4 h-4" />, iconBg: 'bg-muted text-foreground' };
  }
}
