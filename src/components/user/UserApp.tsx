'use client';

import { useState, useEffect, useCallback } from 'react';
import { Home, FilePlus2, User, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { UserHomeTab } from '@/components/user/UserHomeTab';
import { UserRequestTab } from '@/components/user/UserRequestTab';
import { UserProfileTab } from '@/components/user/UserProfileTab';
import { ProviderDetailSheet } from '@/components/shared/ProviderDetailSheet';
import { RequestDetailSheet } from '@/components/shared/RequestDetailSheet';
import { ChatSheet } from '@/components/shared/ChatSheet';
import {
  NotificationsSheet,
  NotificationsBootstrap,
  NotifBadge,
  type NotificationNavigateTarget,
} from '@/components/shared/NotificationsSheet';
import { supabase, type Profile, type ServiceRequest } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { expireDueRequestsClient } from '@/lib/notifications';

type Tab = 'home' | 'request' | 'profile';

export function UserApp() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [selectedProvider, setSelectedProvider] = useState<Profile | null>(null);
  const [providerSheetOpen, setProviderSheetOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [chatPeer, setChatPeer] = useState<Profile | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [requestRefreshKey, setRequestRefreshKey] = useState(0);

  useEffect(() => {
    void expireDueRequestsClient();
  }, []);

  const handleOpenProvider = (p: Profile) => {
    setSelectedProvider(p);
    setProviderSheetOpen(true);
  };

  const handleOpenRequest = (r: ServiceRequest) => {
    setSelectedRequest(r);
    setRequestSheetOpen(true);
  };

  const handleOpenChat = (peer: Profile) => {
    setChatPeer(peer);
    setChatOpen(true);
    setProviderSheetOpen(false);
    setRequestSheetOpen(false);
  };

  const handleNotifNavigate = useCallback(async (target: NotificationNavigateTarget) => {
    if (target.kind === 'none') return;
    if (target.kind === 'profile') {
      setTab('profile');
      return;
    }
    if (target.kind === 'request') {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', target.requestId)
        .maybeSingle();
      if (error || !data) {
        toast.error('تعذّر فتح الطلب');
        return;
      }
      setSelectedRequest(data as ServiceRequest);
      setRequestSheetOpen(true);
      setTab('request');
      return;
    }
    if (target.kind === 'chat' || target.kind === 'provider') {
      const id = target.kind === 'chat' ? target.peerId : target.providerId;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        toast.error('تعذّر فتح المحادثة');
        return;
      }
      if (target.kind === 'provider') {
        setSelectedProvider(data as Profile);
        setProviderSheetOpen(true);
      } else {
        handleOpenChat(data as Profile);
      }
    }
  }, []);

  if (!profile) return null;

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full overflow-x-hidden bg-background">
      <NotificationsBootstrap />
      <header className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between gap-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative w-9 h-9 shrink-0 rounded-full bg-white border border-border/60 shadow-sm ring-1 ring-primary/10 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
          </span>
          <div className="text-sm font-semibold text-foreground/90 truncate">دلّوني عليك</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="font-bold text-base leading-tight">
            {tab === 'home' ? 'الرئيسية' : tab === 'request' ? 'طلب خدمة' : 'الملف الشخصي'}
          </div>
          <button
            onClick={() => setNotifOpen(true)}
            className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center hover:bg-muted transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <NotifBadge />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {tab === 'home' && <UserHomeTab onOpenProvider={handleOpenProvider} />}
        {tab === 'request' && (
          <UserRequestTab
            onOpenRequest={handleOpenRequest}
            refreshKey={requestRefreshKey}
          />
        )}
        {tab === 'profile' && (
          <UserProfileTab
            onOpenChat={handleOpenChat}
            onOpenRequest={handleOpenRequest}
          />
        )}
      </main>

      <nav className="shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-t border-border/40 px-2 pt-1 pb-2">
        <div className="grid grid-cols-3 gap-1">
          <TabButton
            active={tab === 'home'}
            onClick={() => setTab('home')}
            icon={<Home className="w-5 h-5" />}
            label="الرئيسية"
          />
          <TabButton
            active={tab === 'request'}
            onClick={() => setTab('request')}
            icon={<FilePlus2 className="w-5 h-5" />}
            label="طلب خدمة"
          />
          <TabButton
            active={tab === 'profile'}
            onClick={() => setTab('profile')}
            icon={<User className="w-5 h-5" />}
            label="حسابي"
          />
        </div>
      </nav>

      <ProviderDetailSheet
        provider={selectedProvider}
        open={providerSheetOpen}
        onOpenChange={setProviderSheetOpen}
        onOpenChat={handleOpenChat}
      />
      <RequestDetailSheet
        request={selectedRequest}
        requestOwner={
          selectedRequest && profile && selectedRequest.user_id === profile.id
            ? profile
            : null
        }
        open={requestSheetOpen}
        onOpenChange={setRequestSheetOpen}
        onOpenChat={handleOpenChat}
        onOfferSubmitted={() => setRequestRefreshKey((k) => k + 1)}
      />
      <ChatSheet peer={chatPeer} open={chatOpen} onOpenChange={setChatOpen} />
      <NotificationsSheet
        open={notifOpen}
        onOpenChange={setNotifOpen}
        onNavigate={(t) => void handleNotifNavigate(t)}
      />
    </div>
  );
}

function TabButton({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className={`transition-transform ${active ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
