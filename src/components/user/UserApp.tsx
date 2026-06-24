'use client';

import { useState } from 'react';
import { Home, FilePlus2, User, Bell } from 'lucide-react';
import { UserHomeTab } from '@/components/user/UserHomeTab';
import { UserRequestTab } from '@/components/user/UserRequestTab';
import { UserProfileTab } from '@/components/user/UserProfileTab';
import { ProviderDetailSheet } from '@/components/shared/ProviderDetailSheet';
import { RequestDetailSheet } from '@/components/shared/RequestDetailSheet';
import { ChatSheet } from '@/components/shared/ChatSheet';
import { NotificationsSheet } from '@/components/shared/NotificationsSheet';
import type { Profile, ServiceRequest } from '@/lib/supabase';
import { useAuth } from '@/store/auth';

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

  if (!profile) return null;

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
    // Close other sheets
    setProviderSheetOpen(false);
    setRequestSheetOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <header className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
        <div>
          <div className="text-[10px] text-muted-foreground">دلّوني عليك</div>
          <div className="font-bold text-base leading-tight">
            {tab === 'home' ? 'الرئيسية' : tab === 'request' ? 'طلب خدمة' : 'الملف الشخصي'}
          </div>
        </div>
        <button
          onClick={() => setNotifOpen(true)}
          className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center hover:bg-muted transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <NotifBadge userId={profile.id} />
        </button>
      </header>

      {/* Content */}
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

      {/* Bottom tab bar */}
      <nav className="shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-t border-border/40 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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

      {/* Sheets */}
      <ProviderDetailSheet
        provider={selectedProvider}
        open={providerSheetOpen}
        onOpenChange={setProviderSheetOpen}
        onOpenChat={handleOpenChat}
      />
      <RequestDetailSheet
        request={selectedRequest}
        requestOwner={null}
        open={requestSheetOpen}
        onOpenChange={setRequestSheetOpen}
        onOpenChat={handleOpenChat}
        onOfferSubmitted={() => setRequestRefreshKey((k) => k + 1)}
      />
      <ChatSheet peer={chatPeer} open={chatOpen} onOpenChange={setChatOpen} />
      <NotificationsSheet open={notifOpen} onOpenChange={setNotifOpen} />
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

function NotifBadge({ userId }: { userId: string }) {
  return <></>; // NotificationsSheet will manage its own badge via store - placeholder
}
