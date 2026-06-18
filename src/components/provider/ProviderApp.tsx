'use client';

import { useState } from 'react';
import { Home, User, Bell } from 'lucide-react';
import { ProviderHomeTab } from '@/components/provider/ProviderHomeTab';
import { ProviderProfileTab } from '@/components/provider/ProviderProfileTab';
import { RequestDetailSheet } from '@/components/shared/RequestDetailSheet';
import { ChatSheet } from '@/components/shared/ChatSheet';
import { NotificationsSheet } from '@/components/shared/NotificationsSheet';
import type { Profile, ServiceRequest } from '@/lib/supabase';
import { useAuth } from '@/store/auth';

type Tab = 'home' | 'profile';

export function ProviderApp() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [selectedRequestOwner, setSelectedRequestOwner] = useState<Profile | null>(null);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [chatPeer, setChatPeer] = useState<Profile | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!profile) return null;

  const handleOpenRequest = (r: ServiceRequest, owner?: Profile) => {
    setSelectedRequest(r);
    setSelectedRequestOwner(owner ?? null);
    setRequestSheetOpen(true);
  };

  const handleOpenChat = (peer: Profile) => {
    setChatPeer(peer);
    setChatOpen(true);
    setRequestSheetOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
        <div>
          <div className="text-[10px] text-muted-foreground">دلّوني عليك</div>
          <div className="font-bold text-base leading-tight">
            {tab === 'home' ? 'طلبات الخدمة' : 'الملف الشخصي'}
          </div>
        </div>
        <button
          onClick={() => setNotifOpen(true)}
          className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Bell className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-hidden">
        {tab === 'home' && <ProviderHomeTab onOpenRequest={handleOpenRequest} />}
        {tab === 'profile' && <ProviderProfileTab onOpenChat={handleOpenChat} />}
      </main>

      <nav className="shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-t border-border/40 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-1">
          <TabButton
            active={tab === 'home'}
            onClick={() => setTab('home')}
            icon={<Home className="w-5 h-5" />}
            label="الرئيسية"
          />
          <TabButton
            active={tab === 'profile'}
            onClick={() => setTab('profile')}
            icon={<User className="w-5 h-5" />}
            label="حسابي"
          />
        </div>
      </nav>

      <RequestDetailSheet
        request={selectedRequest}
        requestOwner={selectedRequestOwner}
        open={requestSheetOpen}
        onOpenChange={setRequestSheetOpen}
        onOpenChat={handleOpenChat}
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
