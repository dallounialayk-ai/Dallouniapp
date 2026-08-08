'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LogOut, Camera, Phone, MapPin, Edit3, X, Check,
  MessageCircle, Image as ImageIcon, Plus, Trash2, Briefcase,
  Sparkles, Bell, AlertTriangle, Package, Tag, Pencil,
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase, type Profile, type CatalogItem, type Message } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import {
  YEMEN_GOVERNORATES, getCategoryName, getCategoryPath, APP_NAME,
  PRODUCT_UNITS, isBuildingMaterialsProvider,
} from '@/lib/constants';
import { ServiceCategoryPicker } from '@/components/shared/ServiceCategoryPicker';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { getInitials, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { fetchProviderVerification } from '@/lib/verification';

type Conversation = {
  peer: Profile;
  lastMessage: Message;
  unreadCount: number;
};

export function ProviderProfileTab({
  onOpenChat,
}: {
  onOpenChat: (peer: Profile) => void;
}) {
  const { profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp_number ?? '');
  const [governorate, setGovernorate] = useState(profile?.governorate ?? '');
  const [serviceCategory, setServiceCategory] = useState(profile?.service_category ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [newCatalogTitle, setNewCatalogTitle] = useState('');
  const [newCatalogDesc, setNewCatalogDesc] = useState('');
  const [newCatalogImage, setNewCatalogImage] = useState('');
  const [newCatalogPrice, setNewCatalogPrice] = useState('');
  const [newCatalogUnit, setNewCatalogUnit] = useState('');
  const [uploadingCatalog, setUploadingCatalog] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [verified, setVerified] = useState(false);

  const loadCatalog = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('catalog_items')
      .select('*')
      .eq('provider_id', profile.id)
      .order('created_at', { ascending: false });
    setCatalog((data ?? []) as CatalogItem[]);
  }, [profile]);

  const loadConversations = useCallback(async () => {
    if (!profile) return;
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
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    void fetchProviderVerification(profile.id, profile.admin_verified).then((r) => {
      setVerified(r.verified);
    });
  }, [profile]);

  useEffect(() => {
    loadCatalog();
    loadConversations();
  }, [loadCatalog, loadConversations]);

  if (!profile) return null;

  // تحديد إذا كان مقدم الخدمة يبيع مواد بناء (منتجات بأسعار) أو خدمات/أعمال
  const isMaterialsProvider = isBuildingMaterialsProvider(profile.service_category);

  const handleSaveProfile = async () => {
    if (!serviceCategory) {
      toast.error('الرجاء اختيار نوع الخدمة');
      return;
    }
    const { error } = await updateProfile({
      full_name: fullName,
      phone,
      whatsapp_number: whatsapp.trim() || null,
      governorate,
      service_category: serviceCategory,
      bio,
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

  const resetCatalogForm = () => {
    setEditingCatalogId(null);
    setNewCatalogTitle('');
    setNewCatalogDesc('');
    setNewCatalogImage('');
    setNewCatalogPrice('');
    setNewCatalogUnit('');
  };

  const openAddCatalogDialog = () => {
    resetCatalogForm();
    setCatalogDialogOpen(true);
  };

  const openEditCatalogDialog = (item: CatalogItem) => {
    setEditingCatalogId(item.id);
    setNewCatalogTitle(item.title ?? '');
    setNewCatalogDesc(item.description ?? '');
    setNewCatalogImage(item.image_url ?? '');
    setNewCatalogPrice(item.price != null ? String(item.price) : '');
    setNewCatalogUnit(item.unit ?? '');
    setCatalogDialogOpen(true);
  };

  const handleCatalogImageUpload = async (file: File) => {
    if (!profile) return;
    setUploadingCatalog(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage
      .from('catalog')
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      setUploadingCatalog(false);
      return;
    }
    const { data } = supabase.storage.from('catalog').getPublicUrl(path);
    setNewCatalogImage(data.publicUrl);
    setUploadingCatalog(false);
  };

  const handleSaveCatalog = async () => {
    if (!profile) return;
    if (!newCatalogTitle.trim()) {
      toast.error(isMaterialsProvider ? 'الرجاء إدخال اسم الصنف' : 'الرجاء إدخال عنوان للعمل');
      return;
    }
    if (!newCatalogImage) {
      toast.error(isMaterialsProvider ? 'الرجاء إضافة صورة للصنف' : 'الرجاء إضافة صورة للعمل');
      return;
    }
    if (isMaterialsProvider && !newCatalogPrice.trim()) {
      toast.error('الرجاء إدخال سعر الوحدة');
      return;
    }

    setSavingCatalog(true);

    const payload: Record<string, unknown> = {
      title: newCatalogTitle.trim(),
      description: newCatalogDesc.trim() || null,
      image_url: newCatalogImage,
    };
    if (isMaterialsProvider) {
      payload.price = parseFloat(newCatalogPrice) || null;
      payload.unit = newCatalogUnit || null;
    }

    try {
      if (editingCatalogId) {
        let { data, error } = await supabase
          .from('catalog_items')
          .update(payload)
          .eq('id', editingCatalogId)
          .eq('provider_id', profile.id)
          .select('*')
          .single();

        if (error && isMaterialsProvider && error.message.includes('column')) {
          const fallback = await supabase
            .from('catalog_items')
            .update({
              title: payload.title,
              description: `${newCatalogDesc.trim() || ''}\n\nالسعر: ${formatCurrency(parseFloat(newCatalogPrice))}${newCatalogUnit ? ' / ' + newCatalogUnit : ''}`.trim(),
              image_url: newCatalogImage,
            })
            .eq('id', editingCatalogId)
            .eq('provider_id', profile.id)
            .select('*')
            .single();
          data = fallback.data;
          error = fallback.error;
        }

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          setCatalog((prev) =>
            prev.map((c) => (c.id === editingCatalogId ? (data as CatalogItem) : c))
          );
        }
        toast.success(isMaterialsProvider ? 'تم تحديث الصنف بنجاح' : 'تم تحديث العمل بنجاح');
      } else {
        const insertData: Record<string, unknown> = {
          provider_id: profile.id,
          ...payload,
        };

        let { data, error } = await supabase
          .from('catalog_items')
          .insert(insertData)
          .select('*')
          .single();

        if (error && isMaterialsProvider && error.message.includes('column')) {
          const fallback = await supabase
            .from('catalog_items')
            .insert({
              provider_id: profile.id,
              title: newCatalogTitle.trim(),
              description: `${newCatalogDesc.trim() || ''}\n\nالسعر: ${formatCurrency(parseFloat(newCatalogPrice))}${newCatalogUnit ? ' / ' + newCatalogUnit : ''}`.trim(),
              image_url: newCatalogImage,
            })
            .select('*')
            .single();
          data = fallback.data;
          error = fallback.error;
          if (!error) {
            if (data) setCatalog((prev) => [data as CatalogItem, ...prev]);
            toast.success('تمت إضافة الصنف (السعر محفوظ في الوصف مؤقتًا)');
            setCatalogDialogOpen(false);
            resetCatalogForm();
            return;
          }
        }

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          setCatalog((prev) => [data as CatalogItem, ...prev]);
        }
        toast.success(isMaterialsProvider ? 'تمت إضافة الصنف للكاتلوج' : 'تمت إضافة العمل للكاتلوج');
      }

      setCatalogDialogOpen(false);
      resetCatalogForm();
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleDeleteCatalog = async (id: string) => {
    const { error } = await supabase.from('catalog_items').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCatalog((prev) => prev.filter((c) => c.id !== id));
    toast.success(isMaterialsProvider ? 'تم حذف الصنف' : 'تم حذف العمل');
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
                  <AvatarFallback className="rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-700 font-bold text-xl">
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
                  <h3 className="font-bold text-lg mt-3 inline-flex items-center justify-center gap-1.5">
                    {profile.full_name}
                    <VerifiedBadge verified={verified} size="md" />
                  </h3>
                  <Badge variant="secondary" className="mt-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {getCategoryPath(profile.service_category ?? '')}
                  </Badge>
                  {profile.bio && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                      {profile.bio}
                    </p>
                  )}
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
                  <div>
                    <Label className="text-xs">نوع الخدمة</Label>
                    <div className="mt-1">
                      <ServiceCategoryPicker
                        value={serviceCategory}
                        onChange={setServiceCategory}
                        mode="select"
                        placeholder="اختر التصنيف ثم التخصص"
                        triggerClassName="w-full h-10 rounded-xl bg-muted/40 border border-border/60 px-3 text-sm text-right flex items-center justify-between gap-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">نبذة عن الخدمة</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="mt-1 rounded-xl bg-muted/40 resize-none text-sm"
                      placeholder="اكتب وصفًا موجزًا عن خبراتك وخدماتك…"
                    />
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
                        setServiceCategory(profile.service_category ?? '');
                        setBio(profile.bio ?? '');
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
          <Tabs defaultValue="catalog" className="w-full">
            <TabsList className="w-full h-10 rounded-xl bg-muted/50 p-1">
              <TabsTrigger value="catalog" className="rounded-lg text-xs">
                {isMaterialsProvider ? (
                  <Package className="w-3.5 h-3.5 ml-1.5" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 ml-1.5" />
                )}
                {isMaterialsProvider ? 'الأصناف' : 'الكاتلوج'}
                {catalog.length > 0 && (
                  <span className="bg-muted-foreground text-background text-[9px] rounded-full px-1.5 py-0.5 mr-1">
                    {catalog.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages" className="rounded-lg text-xs">
                <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
                الرسائل
                {conversations.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
                  <span className="bg-primary text-primary-foreground text-[9px] rounded-full px-1.5 py-0.5 mr-1">
                    {conversations.reduce((s, c) => s + c.unreadCount, 0)}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="mt-3">
              <Button
                onClick={openAddCatalogDialog}
                className="w-full h-10 rounded-xl mb-3"
              >
                {isMaterialsProvider ? (
                  <>
                    <Package className="w-4 h-4 ml-1.5" />
                    إضافة صنف جديد
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 ml-1.5" />
                    إضافة عمل جديد
                  </>
                )}
              </Button>
              {catalog.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
                    {isMaterialsProvider ? (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {isMaterialsProvider ? 'لا توجد أصناف بعد' : 'لا توجد أعمال بعد'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isMaterialsProvider
                      ? 'أضف أصناف مواد البناء وأسعارها لكسب ثقة العملاء'
                      : 'أضف صور أعمالك السابقة لكسب ثقة العملاء'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {catalog.map((c) => (
                    <div
                      key={c.id}
                      className="bg-card rounded-2xl overflow-hidden border border-border/60 elevate-1 group"
                    >
                      <div className="relative aspect-square">
                        <img
                          src={c.image_url}
                          alt={c.title}
                          className="w-full h-full object-cover"
                        />
                        {isMaterialsProvider && c.price != null && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-2 py-0.5 shadow-md">
                            {formatCurrency(c.price)}
                            {c.unit && <span className="font-normal opacity-90"> / {c.unit}</span>}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex flex-col gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openEditCatalogDialog(c)}
                            className="w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center"
                            title="تعديل"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCatalog(c.id)}
                            className="w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <h4 className="font-semibold text-xs truncate">{c.title}</h4>
                        {c.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                            {c.description}
                          </p>
                        )}
                        {isMaterialsProvider && c.price != null && (
                          <div className="mt-1.5 flex items-center gap-1 text-primary font-bold text-xs">
                            <Tag className="w-3 h-3" />
                            {formatCurrency(c.price)}
                            {c.unit && (
                              <span className="text-muted-foreground font-normal text-[10px]">
                                / {c.unit}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages" className="mt-3">
              {conversations.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
                    <MessageCircle className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">لا توجد رسائل بعد</p>
                  <p className="text-xs text-muted-foreground mt-1">ستظهر محادثاتك مع العملاء هنا</p>
                </div>
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
          </Tabs>

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
              {APP_NAME} • الإصدار 0.2.0
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

      {/* Catalog add / edit dialog */}
      <Dialog
        open={catalogDialogOpen}
        onOpenChange={(open) => {
          setCatalogDialogOpen(open);
          if (!open) resetCatalogForm();
        }}
      >
        <DialogContent className="rounded-3xl max-w-md max-h-[90vh] overflow-y-auto scrollbar-overlay">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingCatalogId
                ? isMaterialsProvider
                  ? 'تعديل الصنف'
                  : 'تعديل العمل'
                : isMaterialsProvider
                  ? 'إضافة صنف جديد'
                  : 'إضافة عمل للكاتلوج'}
            </DialogTitle>
            <DialogDescription className="text-right">
              {editingCatalogId
                ? isMaterialsProvider
                  ? 'حدّث السعر أو الصورة أو الوصف وأي تفاصيل للصنف'
                  : 'حدّث صورة العمل والوصف والتفاصيل'
                : isMaterialsProvider
                  ? 'أضف أصناف مواد البناء مع الأسعار لعرضها للعملاء'
                  : 'اعرض أعمالك السابقة لكسب ثقة العملاء'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              {newCatalogImage ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                  <img src={newCatalogImage} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <label className="w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center cursor-pointer">
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleCatalogImageUpload(f);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewCatalogImage('')}
                      className="w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {uploadingCatalog && (
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <label className="block aspect-video rounded-xl bg-muted/40 border-2 border-dashed border-border/60 flex items-center justify-center cursor-pointer hover:bg-muted/60 transition-colors">
                  {uploadingCatalog ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-7 h-7 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">
                        {isMaterialsProvider ? 'اضغط لرفع صورة الصنف' : 'اضغط لرفع صورة'}
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleCatalogImageUpload(f);
                    }}
                  />
                </label>
              )}
            </div>
            <div>
              <Label className="text-xs">
                {isMaterialsProvider ? 'اسم الصنف *' : 'عنوان العمل *'}
              </Label>
              <Input
                value={newCatalogTitle}
                onChange={(e) => setNewCatalogTitle(e.target.value)}
                placeholder={isMaterialsProvider ? 'مثال: أسمنت بورتلاندي 50 كجم' : 'مثال: بناء فيلا 400م'}
                className="mt-1 h-11 rounded-xl bg-muted/40"
              />
            </div>

            {isMaterialsProvider && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">سعر الوحدة (ريال) *</Label>
                  <Input
                    type="number"
                    value={newCatalogPrice}
                    onChange={(e) => setNewCatalogPrice(e.target.value)}
                    placeholder="مثال: 8500"
                    className="mt-1 h-11 rounded-xl bg-muted/40"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs">وحدة القياس</Label>
                  <Select value={newCatalogUnit || undefined} onValueChange={setNewCatalogUnit}>
                    <SelectTrigger className="mt-1 h-11 rounded-xl bg-muted/40">
                      <SelectValue placeholder="اختر الوحدة" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {PRODUCT_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs">
                {isMaterialsProvider ? 'وصف الصنف' : 'وصف العمل'}
              </Label>
              <Textarea
                value={newCatalogDesc}
                onChange={(e) => setNewCatalogDesc(e.target.value)}
                rows={3}
                className="mt-1 rounded-xl bg-muted/40 resize-none text-sm"
                placeholder={
                  isMaterialsProvider
                    ? 'موجز عن الصنف: الماركة، المواصفات، الجودة…'
                    : 'موجز عن العمل والمدة والميزانية…'
                }
              />
            </div>
            <Button
              onClick={() => void handleSaveCatalog()}
              className="w-full h-11 rounded-xl font-semibold"
              disabled={uploadingCatalog || savingCatalog}
            >
              {savingCatalog
                ? 'جاري الحفظ…'
                : editingCatalogId
                  ? isMaterialsProvider
                    ? 'حفظ التعديلات'
                    : 'حفظ التعديلات'
                  : isMaterialsProvider
                    ? 'إضافة الصنف'
                    : 'إضافة للكاتلوج'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
