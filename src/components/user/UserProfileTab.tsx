'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  User, LogOut, MessageCircle, FileText, Camera, ChevronLeft,
  Phone, MapPin, Edit3, X, Check, MessageSquare, Inbox,
  CircleDollarSign, Bell, AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase, type Profile, type ServiceRequest, type Offer, type Message } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { YEMEN_GOVERNORATES, getCategoryPath, APP_NAME, APP_VERSION } from '@/lib/constants';
import { getInitials, formatRelativeTime, formatCurrency } from '@/lib/utils';

type Conversation = {
  peer: Profile;
  lastMessage: Message;
  unreadCount: number;
};

export function UserProfileTab({
  onOpenChat, onOpenRequest,
}: {
  onOpenChat: (peer: Profile) => void;
  onOpenRequest: (r: ServiceRequest) => void;
}) {
  const { profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp_number ?? '');
  const [governorate, setGovernorate] = useState(profile?.governorate ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [offersByRequest, setOffersByRequest] = useState<Record<string, Offer[]>>({});

  const loadData = useCallback(async () => {
    if (!profile) return;

    // Conversations: get distinct peers from messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });

    if (msgs && msgs.length > 0) {
      const peerIds = new Set<string>();
      const lastByPeer: Record<string, Message> = {};
      const unreadByPeer: Record<string, number> = {};
      msgs.forEach((m: Message) => {
        const peerId = m.sender_id === profile.id ? m.receiver_id : m.sender_id;
        peerIds.add(peerId);
        if (!lastByPeer[peerId] || new Date(m.created_at) > new Date(lastByPeer[peerId].created_at)) {
          lastByPeer[peerId] = m;
        }
        if (m.receiver_id === profile.id && !m.read_at) {
          unreadByPeer[peerId] = (unreadByPeer[peerId] ?? 0) + 1;
        }
      });
      const { data: peers } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(peerIds));
      const peerMap: Record<string, Profile> = {};
      (peers ?? []).forEach((p) => peerMap[p.id] = p as Profile);
      const convos = Array.from(peerIds).map((id) => ({
        peer: peerMap[id],
        lastMessage: lastByPeer[id],
        unreadCount: unreadByPeer[id] ?? 0,
      })).filter((c) => c.peer);
      setConversations(convos);
    } else {
      setConversations([]);
    }

    // My requests + offers
    const { data: reqs } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setMyRequests((reqs ?? []) as ServiceRequest[]);

    if (reqs && reqs.length > 0) {
      const { data: offers } = await supabase
        .from('offers')
        .select('*, profile:profiles!provider_id(*)')
        .in('request_id', reqs.map((r) => r.id))
        .order('created_at', { ascending: false });
      const map: Record<string, Offer[]> = {};
      (offers ?? []).forEach((o) => {
        if (!map[o.request_id]) map[o.request_id] = [];
        map[o.request_id].push(o as Offer);
      });
      setOffersByRequest(map);
    }
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!profile) return null;

  const handleSaveProfile = async () => {
    const { error } = await updateProfile({
      full_name: fullName,
      phone,
      whatsapp_number: whatsapp.trim() || null,
      governorate,
      avatar_url: avatarUrl,
    });
    if (error) toast.error(error);
    else {
      toast.success('تم تحديث الملف الشخصي');
      setEditing(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error(uploadError.message);
      setUploadingAvatar(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploadingAvatar(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (e) {
      toast.error('تعذّر تسجيل الخروج، حاول مرة أخرى');
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="p-4 pb-8 space-y-4">
          {/* Profile card */}
          <div className="bg-card rounded-2xl p-5 border border-border/60 elevate-1">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="w-20 h-20 rounded-3xl border-2 border-border/40">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="rounded-3xl bg-gradient-to-br from-primary/20 to-accent text-primary font-bold text-xl">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                {editing && (
                  <label className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer elevate-1">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAvatarUpload(f);
                      }}
                    />
                  </label>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-3xl bg-black/40 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {!editing ? (
                <>
                  <h3 className="font-bold text-lg mt-3">{profile.full_name}</h3>
                  <Badge variant="secondary" className="mt-1">مستخدم</Badge>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1" dir="ltr">
                      <Phone className="w-3 h-3" />
                      {profile.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.governorate}
                    </span>
                  </div>
                  {profile.whatsapp_number && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                      <MessageCircle className="w-3 h-3" />
                      واتساب: {profile.whatsapp_number}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="mt-3 h-9 rounded-xl text-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 ml-1.5" />
                    تعديل الملف
                  </Button>
                </>
              ) : (
                <div className="w-full mt-4 space-y-3 text-right">
                  <div>
                    <Label className="text-xs">الاسم</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 h-10 rounded-xl bg-muted/40"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">الهاتف</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 h-10 rounded-xl bg-muted/40"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">رقم الواتساب</Label>
                    <Input
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="7XX XXX XXX"
                      className="mt-1 h-10 rounded-xl bg-muted/40"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">المحافظة</Label>
                    <Select value={governorate} onValueChange={setGovernorate}>
                      <SelectTrigger className="mt-1 h-10 rounded-xl bg-muted/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {YEMEN_GOVERNORATES.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1 h-10 rounded-xl"
                    >
                      <Check className="w-4 h-4 ml-1.5" />
                      حفظ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setFullName(profile.full_name);
                        setPhone(profile.phone);
                        setGovernorate(profile.governorate);
                        setAvatarUrl(profile.avatar_url ?? '');
                        setWhatsapp(profile.whatsapp_number ?? '');
                      }}
                      className="flex-1 h-10 rounded-xl"
                    >
                      <X className="w-4 h-4 ml-1.5" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sections */}
          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="w-full h-10 rounded-xl bg-muted/50 p-1">
              <TabsTrigger value="messages" className="rounded-lg text-xs">
                <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
                الرسائل
                {conversations.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
                  <span className="bg-primary text-primary-foreground text-[9px] rounded-full px-1.5 py-0.5 mr-1">
                    {conversations.reduce((s, c) => s + c.unreadCount, 0)}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests" className="rounded-lg text-xs">
                <FileText className="w-3.5 h-3.5 ml-1.5" />
                طلباتي
                {myRequests.length > 0 && (
                  <span className="bg-muted-foreground text-background text-[9px] rounded-full px-1.5 py-0.5 mr-1">
                    {myRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="mt-3">
              {conversations.length === 0 ? (
                <EmptySection
                  icon={<Inbox className="w-6 h-6" />}
                  title="لا توجد رسائل بعد"
                  subtitle="ابدأ محادثة مع مقدم خدمة من بطاقته"
                />
              ) : (
                <div className="space-y-2">
                  {conversations.map((c) => (
                    <button
                      key={c.peer.id}
                      onClick={() => onOpenChat(c.peer)}
                      className="w-full text-right flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 elevate-1 hover:elevate-2 transition-all"
                    >
                      <div className="relative">
                        <Avatar className="w-11 h-11 rounded-xl">
                          <AvatarImage src={c.peer.avatar_url ?? undefined} />
                          <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
                            {getInitials(c.peer.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        {c.unreadCount > 0 && (
                          <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center pulse-badge">
                            {c.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm truncate">{c.peer.full_name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatRelativeTime(c.lastMessage.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.lastMessage.sender_id === profile.id ? 'أنت: ' : ''}
                          {c.lastMessage.content}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="mt-3">
              {myRequests.length === 0 ? (
                <EmptySection
                  icon={<FileText className="w-6 h-6" />}
                  title="لا توجد طلبات بعد"
                  subtitle="أنشئ طلبك الأول من تبويب طلب خدمة"
                />
              ) : (
                <div className="space-y-3">
                  {myRequests.map((r) => {
                    const offers = offersByRequest[r.id] ?? [];
                    return (
                      <div
                        key={r.id}
                        className="bg-card rounded-2xl p-3.5 border border-border/60 elevate-1"
                      >
                        <button
                          onClick={() => onOpenRequest(r)}
                          className="w-full text-right"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm flex-1">{r.title}</h4>
                            <Badge variant={r.status === 'open' ? 'default' : 'secondary'} className="text-[10px]">
                              {r.status === 'open' ? 'مفتوح' : 'مغلق'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">
                              {getCategoryPath(r.category)}
                            </Badge>
                            <span>{formatRelativeTime(r.created_at)}</span>
                          </div>
                        </button>
                        {offers.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/40">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1.5">
                              <CircleDollarSign className="w-3.5 h-3.5" />
                              {offers.length} عرض سعر
                            </div>
                            <div className="space-y-1.5">
                              {offers.slice(0, 3).map((o) => (
                                <div
                                  key={o.id}
                                  className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30"
                                >
                                  <Avatar className="w-6 h-6 rounded-md">
                                    <AvatarImage src={o.profile?.avatar_url ?? undefined} />
                                    <AvatarFallback className="rounded-md bg-primary/10 text-primary text-[9px] font-bold">
                                      {getInitials(o.profile?.full_name ?? '؟')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium flex-1 truncate">{o.profile?.full_name}</span>
                                  {o.price && (
                                    <span className="text-primary font-bold">{formatCurrency(o.price)}</span>
                                  )}
                                  <Badge
                                    variant={o.status === 'accepted' ? 'default' : o.status === 'rejected' ? 'destructive' : 'secondary'}
                                    className="text-[9px]"
                                  >
                                    {o.status === 'accepted' ? 'مقبول' : o.status === 'rejected' ? 'مرفوض' : 'بانتظار'}
                                  </Badge>
                                </div>
                              ))}
                              {offers.length > 3 && (
                                <button
                                  onClick={() => onOpenRequest(r)}
                                  className="text-xs text-primary font-medium w-full text-center pt-1"
                                >
                                  عرض +{offers.length - 3} المزيد
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Logout */}
          <Button
            variant="outline"
            onClick={() => setSignOutOpen(true)}
            className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5 font-semibold"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>

          <div className="text-center space-y-1">
            <a
              href="/privacy"
              className="text-xs text-primary font-medium underline-offset-2 hover:underline"
            >
              سياسة الخصوصية
            </a>
            <div className="text-[10px] text-muted-foreground/70">
              {APP_NAME} • الإصدار {APP_VERSION}
            </div>
          </div>
        </div>
      </div>

      {/* Sign-out confirmation dialog */}
      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-lg">تأكيد تسجيل الخروج</DialogTitle>
            <DialogDescription className="text-center">
              هل أنت متأكد من تسجيل الخروج من حسابك؟
              <br />
              ستحتاج لإدخال رقم الهاتف وكلمة السر للدخول مجددًا.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setSignOutOpen(false)}
              disabled={signingOut}
              className="flex-1 h-11 rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex-1 h-11 rounded-xl"
            >
              {signingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin ml-2" />
                  جاري الخروج…
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 ml-2" />
                  نعم، خروج
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptySection({
  icon, title, subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center py-10">
      <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}
