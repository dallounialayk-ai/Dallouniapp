'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, X, CheckCheck, Trash2, MessageCircle, CircleDollarSign, FileText, Sparkles } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase, type AppNotification } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { formatRelativeTime } from '@/lib/utils';

export function NotificationsSheet({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data ?? []) as AppNotification[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (open && profile) load();
  }, [open, profile, load]);

  // Realtime subscribe
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`notifications-${profile.id}`)
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
          setNotifications((prev) => [n, ...prev]);
          toast(n.title, { description: n.body });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const handleMarkAllRead = async () => {
    if (!profile) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClear = async () => {
    if (!profile) return;
    // Soft-clear: mark all as read (DELETE قد يكون محظورًا بـ RLS)
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id);
    if (error) {
      toast.error(error.message || 'تعذّر مسح الإشعارات');
      return;
    }
    setNotifications([]);
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

        {notifications.length > 0 && (
          <div className="px-5 py-2 flex items-center gap-2 border-b border-border/30 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 rounded-lg text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 ml-1.5" />
              تعليم الكل كمقروء
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
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
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">لا توجد إشعارات</p>
                <p className="text-xs text-muted-foreground mt-1">ستظهر هنا عند وصول رسالة أو عرض جديد</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifRow
                  key={n.id}
                  notif={n}
                  onRead={(id) =>
                    setNotifications((prev) => prev.filter((x) => x.id !== id))
                  }
                />
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotifRow({
  notif,
  onRead,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
}) {
  const icon = (() => {
    switch (notif.type) {
      case 'message': return <MessageCircle className="w-4 h-4" />;
      case 'offer': case 'offer_accepted': case 'offer_rejected': return <CircleDollarSign className="w-4 h-4" />;
      case 'new_request': return <FileText className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  })();
  const iconBg = (() => {
    switch (notif.type) {
      case 'message': return 'bg-blue-100 text-blue-600';
      case 'offer': case 'offer_accepted': return 'bg-emerald-100 text-emerald-600';
      case 'offer_rejected': return 'bg-red-100 text-red-600';
      case 'new_request': return 'bg-amber-100 text-amber-600';
      default: return 'bg-purple-100 text-purple-600';
    }
  })();

  const handleMarkRead = async () => {
    if (!notif.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
      onRead(notif.id);
    }
  };

  return (
    <button
      onClick={handleMarkRead}
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
