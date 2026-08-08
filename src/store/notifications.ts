'use client';

import { create } from 'zustand';
import { supabase, type AppNotification } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type NotificationsState = {
  unreadCount: number;
  items: AppNotification[];
  loading: boolean;
  subscribedUserId: string | null;
  channel: RealtimeChannel | null;
  loadUnreadCount: (userId: string) => Promise<void>;
  loadItems: (userId: string) => Promise<void>;
  subscribe: (userId: string) => void;
  unsubscribe: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
  decrement: () => void;
  setUnreadCount: (n: number) => void;
};

export const useNotifications = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  items: [],
  loading: false,
  subscribedUserId: null,
  channel: null,

  setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),

  decrement: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),

  loadUnreadCount: async (userId) => {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    set({ unreadCount: count ?? 0 });
  },

  loadItems: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80);
    set({ items: (data ?? []) as AppNotification[], loading: false });
  },

  subscribe: (userId) => {
    const prev = get();
    if (prev.subscribedUserId === userId && prev.channel) return;
    prev.channel?.unsubscribe();

    const channel = supabase
      .channel(`notif-store-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as AppNotification;
          set((s) => ({
            items: [n, ...s.items].slice(0, 80),
            unreadCount: s.unreadCount + (n.read ? 0 : 1),
          }));
          // toast handled in NotificationsBootstrap to avoid duplicate if sheet also toasts
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void get().loadUnreadCount(userId);
        }
      )
      .subscribe();

    set({ channel, subscribedUserId: userId });
    void get().loadUnreadCount(userId);
  },

  unsubscribe: () => {
    const { channel } = get();
    channel?.unsubscribe();
    set({ channel: null, subscribedUserId: null, unreadCount: 0, items: [] });
  },

  markRead: async (id) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) return;
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - (s.items.find((n) => n.id === id && !n.read) ? 1 : 0)),
    }));
  },

  markAllRead: async (userId) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    set((s) => ({
      items: s.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));
