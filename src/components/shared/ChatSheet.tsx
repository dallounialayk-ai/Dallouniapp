'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Send, Phone, X, MessageCircle,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase, type Profile, type Message } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { getInitials, formatRelativeTime } from '@/lib/utils';

/**
 * ChatSheet — نافذة محادثة فورية مع تحديث لحظي
 *
 * تحسينات رئيسية:
 * 1. إضافة الرسالة المرسلة محليًا فورًا (optimistic update) قبل استلامها من Realtime
 * 2. اشتراك Realtime بسيط بدون filter معقد — نفلتر يدويًا في الكود
 * 3. منع التكرار: لا نضيف رسالة موجودة بالفعل (مقارنة بالـ id)
 * 4. إعادة التمرير لأسفل تلقائيًا عند كل تحديث
 */
export function ChatSheet({
  peer, open, onOpenChange,
}: {
  peer: Profile | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // الحفاظ على مرجع للرسائل للاستخدام داخل callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // التمرير لأسفل عند كل تحديث للرسائل
  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    });
  }, []);

  // إضافة رسالة جديدة مع منع التكرار
  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      // منع التكرار: تجاهل الرسالة إذا كانت موجودة بالفعل
      if (prev.some((m) => m.id === msg.id)) {
        return prev;
      }
      // استبدال الرسالة المؤقتة (optimistic) بالرسالة الحقيقية من Realtime
      const tempIdx = prev.findIndex(
        (m) =>
          m.id.startsWith('temp-') &&
          m.sender_id === msg.sender_id &&
          m.receiver_id === msg.receiver_id &&
          m.content === msg.content
      );
      if (tempIdx >= 0) {
        const updated = [...prev];
        updated[tempIdx] = msg;
        return updated;
      }
      // إدراج بالترتيب الزمني
      const last = prev[prev.length - 1];
      if (!last || new Date(msg.created_at) >= new Date(last.created_at)) {
        return [...prev, msg];
      }
      // إذا كانت الرسالة قديمة (نادرة)، أدرجها في المكان المناسب
      const updated = [...prev, msg].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return updated;
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!profile || !peer) return;
    setLoading(true);
    // استخدمنا filterين منفصلين بدلاً من or معقد لتجنب مشاكل الصياغة
    const { data: sent, error: err1 } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', profile.id)
      .eq('receiver_id', peer.id)
      .order('created_at', { ascending: true });

    const { data: received, error: err2 } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', peer.id)
      .eq('receiver_id', profile.id)
      .order('created_at', { ascending: true });

    if (!err1 && !err2) {
      const all = [...(sent ?? []), ...(received ?? [])] as Message[];
      all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(all);
      setTimeout(() => scrollToBottom(false), 50);
    }
    setLoading(false);

    // تعليم رسائل الطرف الآخر كمقروءة
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', profile.id)
      .eq('sender_id', peer.id)
      .is('read_at', null);
  }, [profile, peer, scrollToBottom]);

  // تحميل الرسائل عند الفتح
  useEffect(() => {
    if (open && profile && peer) {
      setMessages([]);
      loadMessages();
    }
  }, [open, profile, peer, loadMessages]);

  // Polling fallback — يفحص كل 2 ثانية عن رسائل جديدة
  // (منفصل عن Realtime لتجنب إعادة التشغيل)
  useEffect(() => {
    if (!open || !profile || !peer) return;

    const intervalId = setInterval(async () => {
      try {
        // استعلامان منفصلان بدلاً من or معقد
        const { data: sent } = await supabase
          .from('messages')
          .select('*')
          .eq('sender_id', profile.id)
          .eq('receiver_id', peer.id)
          .order('created_at', { ascending: true });

        const { data: received } = await supabase
          .from('messages')
          .select('*')
          .eq('sender_id', peer.id)
          .eq('receiver_id', profile.id)
          .order('created_at', { ascending: true });

        const all = [...(sent ?? []), ...(received ?? [])] as Message[];
        all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        if (all.length > 0) {
          const currentIds = new Set(messagesRef.current.map((m) => m.id));
          const newMessages = all.filter(
            (m) => !currentIds.has(m.id) && !m.id.startsWith('temp-')
          );
          if (newMessages.length > 0) {
            newMessages.forEach((m) => addMessage(m));
            setTimeout(() => scrollToBottom(), 50);
          }
        }
      } catch (e) {
        // تجاهل
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [open, profile?.id, peer?.id]);

  // اشتراك Realtime — للتحديث الفوري عندما يكون متاحًا
  useEffect(() => {
    if (!open || !profile || !peer) return;

    const channelName = `chat-${[profile.id, peer.id].sort().join('-')}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as Message;
          const isRelevant =
            (msg.sender_id === profile.id && msg.receiver_id === peer.id) ||
            (msg.sender_id === peer.id && msg.receiver_id === profile.id);
          if (!isRelevant) return;

          addMessage(msg);

          if (msg.receiver_id === profile.id) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', msg.id)
              .then(() => {});
          }

          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, profile?.id, peer?.id]);

  const handleSend = async () => {
    if (!input.trim() || !profile || !peer || sending) return;
    const text = input.trim();
    setSending(true);
    setInput(''); // تفريغ الحقل فورًا

    // إنشاء رسالة مؤقتة محليًا (optimistic update) لإظهارها فورًا
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: profile.id,
      receiver_id: peer.id,
      content: text,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    addMessage(optimisticMsg);
    scrollToBottom();

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile.id,
          receiver_id: peer.id,
          content: text,
        })
        .select()
        .single();

      if (error) throw error;

      // استبدال الرسالة المؤقتة بالرسالة الحقيقية (مع إزالة أي نسخة مكررة من Realtime)
      if (data) {
        const realMsg = data as Message;
        setMessages((prev) => {
          const withoutTempAndDup = prev.filter(
            (m) => m.id !== tempId && m.id !== realMsg.id
          );
          return [...withoutTempAndDup, realMsg].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }

      // إنشاء إشعار للطرف الآخر (عبر RPC function لتجاوز RLS)
      supabase
        .rpc('create_notification', {
          p_user_id: peer.id,
          p_type: 'message',
          p_title: 'رسالة جديدة',
          p_body: `${profile.full_name}: ${text.slice(0, 60)}`,
          p_data: { from: profile.id },
        })
        .then(() => {});
    } catch (e: any) {
      toast.error(e.message || 'تعذّر إرسال الرسالة');
      // إعادة الرسالة للحقل + حذف الرسالة المؤقتة
      setInput(text);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  if (!peer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92%] max-h-[92%] p-0 rounded-t-3xl flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <Avatar className="w-9 h-9 rounded-full">
              <AvatarImage src={peer.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {getInitials(peer.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-bold truncate">{peer.full_name}</SheetTitle>
              <SheetDescription className="sr-only">محادثة</SheetDescription>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {peer.service_category && peer.role === 'provider' ? 'صاحب خدمة' : 'مستخدم'}
              </div>
            </div>
            <button
              onClick={() => window.location.href = `tel:${peer.phone}`}
              className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto scrollbar-overlay min-h-0">
          <div className="p-4 space-y-2 min-h-full flex flex-col justify-end">
            {loading && messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                جاري تحميل الرسائل…
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>ابدأ المحادثة بإرسال أول رسالة</p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isMine = m.sender_id === profile?.id;
                const prevSame = i > 0 && messages[i - 1].sender_id === m.sender_id;
                const isPending = m.id.startsWith('temp-');
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? 'justify-start' : 'justify-end'} ${prevSame ? 'mt-0.5' : 'mt-2'} animate-fade-rise`}
                  >
                    <div
                      className={`max-w-[78%] px-3.5 py-2 text-sm leading-relaxed ${
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-3xl rounded-bl-md'
                          : 'bg-muted/70 text-foreground rounded-3xl rounded-br-md'
                      } ${isPending ? 'opacity-70' : ''}`}
                    >
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                      <div
                        className={`text-[9px] mt-1 text-left ${
                          isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {isPending ? 'جاري الإرسال…' : formatRelativeTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="p-3 border-t border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="اكتب رسالة…"
              className="flex-1 h-11 rounded-full bg-muted/40 border-border/40 px-4"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              size="icon"
              className="w-11 h-11 rounded-full shrink-0"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
