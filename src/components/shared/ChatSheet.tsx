'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Send, Phone, ChevronLeft, X, MessageCircle, MoreVertical,
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!profile || !peer) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${peer.id}),and(sender_id.eq.${peer.id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
    setLoading(false);

    // Mark as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', profile.id)
      .eq('sender_id', peer.id)
      .is('read_at', null);

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [profile, peer]);

  useEffect(() => {
    if (open && profile && peer) {
      loadMessages();
    }
  }, [open, profile, peer, loadMessages]);

  useEffect(() => {
    if (!open || !profile || !peer) return;
    const channel = supabase
      .channel(`chat-${[profile.id, peer.id].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${profile.id},receiver_id.eq.${peer.id}),and(sender_id.eq.${peer.id},receiver_id.eq.${profile.id}))`,
        },
        async (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);
          // Mark as read if I'm the receiver
          if (msg.receiver_id === profile.id) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', msg.id);
          }
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, profile, peer]);

  const handleSend = async () => {
    if (!input.trim() || !profile || !peer) return;
    const text = input.trim();
    setInput('');

    const { error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: peer.id,
      content: text,
    });

    if (error) {
      toast.error(error.message);
      setInput(text);
    }

    // Also create notification
    await supabase.from('notifications').insert({
      user_id: peer.id,
      type: 'message',
      title: 'رسالة جديدة',
      body: `${profile.full_name}: ${text.slice(0, 60)}`,
      data: { from: profile.id },
    });
  };

  if (!peer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] max-h-[92vh] p-0 rounded-t-3xl flex flex-col"
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
              <div className="text-[10px] text-muted-foreground">
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-overlay min-h-0">
          <div className="p-4 space-y-2 min-h-full">
            {loading && messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
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
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? 'justify-start' : 'justify-end'} ${prevSame ? 'mt-0.5' : 'mt-2'}`}
                  >
                    <div
                      className={`max-w-[78%] px-3.5 py-2 text-sm leading-relaxed ${
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-3xl rounded-bl-md'
                          : 'bg-muted/70 text-foreground rounded-3xl rounded-br-md'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                      <div
                        className={`text-[9px] mt-1 text-left ${
                          isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {formatRelativeTime(m.created_at)}
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
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="w-11 h-11 rounded-full shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
