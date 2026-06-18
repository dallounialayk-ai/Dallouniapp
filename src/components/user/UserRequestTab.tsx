'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Plus, ListChecks } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase, type ServiceRequest } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { SERVICE_CATEGORIES, YEMEN_GOVERNORATES, getCategoryName } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock } from 'lucide-react';

export function UserRequestTab({
  onOpenRequest,
  refreshKey,
}: {
  onOpenRequest: (r: ServiceRequest) => void;
  refreshKey?: number;
}) {
  const { profile } = useAuth();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [governorate, setGovernorate] = useState(profile?.governorate ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showList, setShowList] = useState(false);

  const loadMyRequests = async () => {
    if (!profile) return;
    setLoadingList(true);
    const { data } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setMyRequests((data ?? []) as ServiceRequest[]);
    setLoadingList(false);
  };

  const handleSubmit = async () => {
    if (!profile) return;
    if (!category) {
      toast.error('الرجاء اختيار نوع الخدمة');
      return;
    }
    if (!title.trim()) {
      toast.error('الرجاء إدخال اسم للخدمة');
      return;
    }
    if (!description.trim()) {
      toast.error('الرجاء إدخال وصف للخدمة');
      return;
    }
    if (!governorate) {
      toast.error('الرجاء اختيار المحافظة');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        user_id: profile.id,
        category,
        title: title.trim(),
        description: description.trim(),
        governorate,
      })
      .select('*')
      .single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Notify matching providers (those with same category)
    const { data: providers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'provider')
      .eq('service_category', category);
    if (providers && providers.length > 0) {
      const notifs = providers.map((p) => ({
        user_id: p.id,
        type: 'new_request',
        title: 'طلب خدمة جديد في مجالك',
        body: `${title.trim()} — ${governorate}`,
        data: { request_id: (data as ServiceRequest).id },
      }));
      await supabase.from('notifications').insert(notifs);
    }

    toast.success('تم نشر طلبك بنجاح، ستصلك العروض قريبًا');
    setCategory('');
    setTitle('');
    setDescription('');
    setSubmitting(false);
    if (showList) loadMyRequests();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 shrink-0 flex items-center justify-between">
        <h2 className="text-base font-bold">طلب خدمة جديدة</h2>
        <Button
          variant={showList ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const v = !showList;
            setShowList(v);
            if (v) loadMyRequests();
          }}
          className="h-9 rounded-xl text-xs font-medium"
        >
          <ListChecks className="w-3.5 h-3.5 ml-1.5" />
          {showList ? 'إخفاء طلباتي' : 'طلباتي'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="p-4 pb-8">
          {showList ? (
            <div className="space-y-3">
              {loadingList ? (
                <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل…</p>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
                    <ListChecks className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">لا توجد طلبات بعد</p>
                  <p className="text-xs text-muted-foreground mt-1">أنشئ طلبك الأول</p>
                </div>
              ) : (
                myRequests.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onOpenRequest(r)}
                    className="w-full text-right bg-card rounded-2xl p-3.5 border border-border/60 elevate-1 hover:elevate-2 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm flex-1">{r.title}</h3>
                      <Badge variant={r.status === 'open' ? 'default' : 'secondary'} className="text-[10px]">
                        {r.status === 'open' ? 'مفتوح' : 'مغلق'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {getCategoryName(r.category)}
                      </Badge>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {r.governorate}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(r.created_at)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-rise">
              {/* Hero */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/30 rounded-2xl p-4 border border-primary/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">أنشئ طلب خدمة</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      املأ التفاصيل وسيظهر طلبك لجميع مقدمي الخدمات المناسبين في مجالك
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">نوع الخدمة *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1 h-12 rounded-xl bg-muted/40 border-border/60">
                    <SelectValue placeholder="اختر نوع الخدمة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {SERVICE_CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">اسم الخدمة *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: بناء سور أرضي 200م"
                  className="mt-1 h-12 rounded-xl bg-muted/40 border-border/60"
                  maxLength={80}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">وصف الخدمة *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تفاصيل ما تحتاجه: المساحة، المواد، الميزانية التقريبية، الوقت المطلوب…"
                  rows={5}
                  className="mt-1 rounded-xl bg-muted/40 border-border/60 resize-none text-sm"
                  maxLength={1000}
                />
                <div className="text-[10px] text-muted-foreground mt-1 text-left">
                  {description.length}/1000
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">المحافظة *</Label>
                <Select value={governorate} onValueChange={setGovernorate}>
                  <SelectTrigger className="mt-1 h-12 rounded-xl bg-muted/40 border-border/60">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {YEMEN_GOVERNORATES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 rounded-xl text-base font-semibold elevate-1"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin ml-2" />
                    جاري النشر…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    نشر الطلب
                  </>
                )}
              </Button>

              <div className="bg-muted/30 rounded-2xl p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  بمجرد النشر، سيتلقّى جميع مقدمي الخدمات في هذا المجال إشعارًا بطلبك، ويمكنك متابعة العروض الواردة من تبويب الملف الشخصي.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
