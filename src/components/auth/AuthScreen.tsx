'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ArrowRight, ArrowLeft,
  Phone, Lock, MapPin, UserCircle2, Briefcase,
  Sparkles, Shield, CheckCircle2, AlertTriangle,
  Settings, ExternalLink, Info, X, MessageCircle, Copy, Check,
  Loader2, Navigation,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { APP_NAME, APP_TAGLINE, YEMEN_GOVERNORATES } from '@/lib/constants';
import { ServiceCategoryPicker } from '@/components/shared/ServiceCategoryPicker';
import type { UserRole } from '@/lib/supabase';
import {
  getCurrentPosition,
  getGovernorateCenter,
  openDeviceLocationSettings,
  watchVisibilityAndLocate,
  type LatLng,
} from '@/lib/geo';
import { LocationEnableDialog } from '@/components/shared/LocationEnableDialog';
import { LocationPreviewMap } from '@/components/shared/ProvidersMapDynamic';

type Mode = 'select' | 'login' | 'register';
type RegisterRole = 'user' | 'provider';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('select');
  const [pendingRole, setPendingRole] = useState<RegisterRole>('user');

  return (
    <div className="h-full relative overflow-y-auto scrollbar-overlay bg-gradient-to-br from-background via-background to-primary/[0.04]">
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/40 blur-3xl" />

      <div className="relative z-10 min-h-full flex flex-col">
        {/* Brand */}
        <header className="px-6 pt-8 pb-4 flex items-center justify-center">
          <BrandMark />
        </header>

        <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-8 pt-2">
          <AnimatePresence mode="wait">
            {mode === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
              >
                <SelectRole
                  onSelect={(role) => {
                    setPendingRole(role);
                    setMode('register');
                  }}
                  onLogin={() => setMode('login')}
                />
              </motion.div>
            )}

            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
              >
                <LoginForm
                  onBack={() => setMode('select')}
                  onRegister={() => setMode('register')}
                />
              </motion.div>
            )}

            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
              >
                <RegisterForm
                  role={pendingRole}
                  onBack={() => setMode('select')}
                  onSwitchRole={(r) => setPendingRole(r)}
                  onLogin={() => setMode('login')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="px-6 pb-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME} — صُنع بشغف في اليمن
        </footer>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[108px] h-[108px] rounded-[26px] bg-white border border-border/50 elevate-2 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt={APP_NAME}
          width={96}
          height={96}
          className="object-contain p-1"
        />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{APP_TAGLINE}</p>
      </div>
    </div>
  );
}

function SelectRole({
  onSelect, onLogin,
}: {
  onSelect: (role: RegisterRole) => void;
  onLogin: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">مرحبًا بك 👋</h2>
        <p className="text-sm text-muted-foreground">اختر نوع الحساب للمتابعة</p>
      </div>

      <div className="space-y-3">
        <RoleCard
          onClick={() => onSelect('user')}
          icon={<User className="w-7 h-7 text-white" strokeWidth={2.2} />}
          title="مستخدم"
          subtitle="أبحث عن مهندسين وفنيين وحرفيين لبناء منزلي"
          accent="from-primary to-primary/80"
        />
        <RoleCard
          onClick={() => onSelect('provider')}
          icon={<Briefcase className="w-7 h-7 text-white" strokeWidth={2.2} />}
          title="صاحب خدمة"
          subtitle="أقدم خدماتي وموادي في مجال البناء"
          accent="from-emerald-500 to-emerald-600"
        />
      </div>

      <div className="pt-2 text-center">
        <p className="text-sm text-muted-foreground">
          لديك حساب بالفعل؟{' '}
          <button
            onClick={onLogin}
            className="text-primary font-semibold hover:underline"
          >
            تسجيل الدخول
          </button>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2">
        <FeaturePill icon={<Shield className="w-3.5 h-3.5" />} text="موثوق" />
        <FeaturePill icon={<CheckCircle2 className="w-3.5 h-3.5" />} text="مُحتكَر" />
        <FeaturePill icon={<Sparkles className="w-3.5 h-3.5" />} text="سهل" />
      </div>
    </div>
  );
}

function RoleCard({
  onClick, icon, title, subtitle, accent,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full glass-card rounded-3xl p-5 flex items-center gap-4 text-right hover:scale-[1.02] transition-transform"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-base">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</div>
      </div>
      <ArrowLeft className="w-5 h-5 text-muted-foreground shrink-0" />
    </button>
  );
}

function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-medium text-muted-foreground">
      {icon}
      {text}
    </div>
  );
}

function LoginForm({
  onBack, onRegister,
}: {
  onBack: () => void;
  onRegister: () => void;
}) {
  const { signIn, loading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    if (!phone || !password) return;
    const { error } = await signIn(phone, password);
    if (error) setErrorBanner(error);
  };

  return (
    <AuthCard
      title="تسجيل الدخول"
      subtitle="أهلاً بعودتك 👋"
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorBanner && (
          <ErrorBanner message={errorBanner} onClose={() => setErrorBanner(null)} />
        )}

        <Field label="رقم الهاتف" icon={<Phone className="w-4 h-4" />}>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="7XX XXX XXX"
            className="pr-10 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card"
            required
            dir="ltr"
          />
        </Field>

        <Field label="كلمة السر" icon={<Lock className="w-4 h-4" />}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pr-10 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card"
            required
          />
        </Field>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl text-base font-semibold elevate-1"
        >
          {loading ? 'جاري الدخول…' : 'دخول'}
        </Button>
      </form>

      <div className="pt-4 text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{' '}
        <button onClick={onRegister} className="text-primary font-semibold hover:underline">
          أنشئ حسابًا
        </button>
      </div>
    </AuthCard>
  );
}

function RegisterForm({
  role, onBack, onSwitchRole, onLogin,
}: {
  role: RegisterRole;
  onBack: () => void;
  onSwitchRole: (r: RegisterRole) => void;
  onLogin: () => void;
}) {
  const { signUp, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappCopied, setWhatsappCopied] = useState(false);
  const [governorate, setGovernorate] = useState('');
  const [password, setPassword] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [bio, setBio] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const [location, setLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'ok' | 'pending' | 'denied'>('idle');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const locationWatchCleanup = useRef<(() => void) | null>(null);

  const copyPhoneToWhatsapp = () => {
    if (phone && !whatsapp) {
      setWhatsapp(phone);
      setWhatsappCopied(true);
      setTimeout(() => setWhatsappCopied(false), 2000);
    }
  };

  const showCopyButton = !!(phone && !whatsapp && phone !== whatsapp);

  const captureLocation = useCallback(async (gov: string) => {
    if (!gov) return;
    setLocating(true);
    setLocationStatus('pending');
    const result = await getCurrentPosition({ maximumAge: 0 });
    setLocating(false);
    if (result.ok) {
      setLocation(result.coords);
      setLocationStatus('ok');
      setShowLocationDialog(false);
      return;
    }
    const center = getGovernorateCenter(gov);
    setLocation({ lat: center.lat, lng: center.lng });
    setLocationStatus(result.code === 'denied' || result.code === 'unavailable' ? 'denied' : 'pending');
    setShowLocationDialog(true);
  }, []);

  const handleGovernorateChange = (gov: string) => {
    setGovernorate(gov);
    void captureLocation(gov);
  };

  const handleEnableLocation = () => {
    openDeviceLocationSettings();
    locationWatchCleanup.current?.();
    locationWatchCleanup.current = watchVisibilityAndLocate((result) => {
      if (result.ok) {
        setLocation(result.coords);
        setLocationStatus('ok');
        setShowLocationDialog(false);
      }
    });
    void getCurrentPosition({ maximumAge: 0 }).then((result) => {
      if (result.ok) {
        setLocation(result.coords);
        setLocationStatus('ok');
        setShowLocationDialog(false);
        locationWatchCleanup.current?.();
        locationWatchCleanup.current = null;
      }
    });
  };

  useEffect(() => {
    return () => {
      locationWatchCleanup.current?.();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setNeedsEmailConfirmation(false);
    if (!fullName || !phone || !governorate || !password) {
      setErrorBanner('الرجاء إكمال جميع الحقول المطلوبة');
      return;
    }
    if (role === 'provider' && !serviceCategory) {
      setErrorBanner('الرجاء اختيار نوع الخدمة');
      return;
    }

    let finalLat = location?.lat ?? null;
    let finalLng = location?.lng ?? null;
    let status = locationStatus;

    if (status !== 'ok') {
      const result = await getCurrentPosition({ maximumAge: 0 });
      if (result.ok) {
        finalLat = result.coords.lat;
        finalLng = result.coords.lng;
        setLocation(result.coords);
        setLocationStatus('ok');
        status = 'ok';
      } else if (!finalLat || !finalLng) {
        // احتياطي: مركز المحافظة إن رفض المستخدم التفعيل مؤقتًا
        const center = getGovernorateCenter(governorate);
        finalLat = center.lat;
        finalLng = center.lng;
      }
    }

    const result = await signUp({
      password,
      fullName,
      phone,
      whatsappNumber: whatsapp.trim() || undefined,
      governorate,
      role: role as UserRole,
      bio: role === 'provider' ? bio : undefined,
      serviceCategory: role === 'provider' ? serviceCategory : undefined,
      latitude: finalLat,
      longitude: finalLng,
    });
    if (result.error) {
      if (result.needsEmailConfirmation) {
        setNeedsEmailConfirmation(true);
      } else {
        setErrorBanner(result.error);
      }
    }
  };

  const mapCenter = location ?? (governorate ? getGovernorateCenter(governorate) : null);

  return (
    <AuthCard
      title={role === 'user' ? 'إنشاء حساب مستخدم' : 'إنشاء حساب صاحب خدمة'}
      subtitle={role === 'user' ? 'سجّل وابدأ رحلة بناء منزلك' : 'سجّل وقدّم خدماتك لآلاف العملاء'}
      onBack={onBack}
    >
      <div className="flex gap-2 p-1 rounded-xl bg-muted/50 mb-5">
        <RoleTabButton active={role === 'user'} onClick={() => onSwitchRole('user')}>
          <User className="w-3.5 h-3.5" /> مستخدم
        </RoleTabButton>
        <RoleTabButton active={role === 'provider'} onClick={() => onSwitchRole('provider')}>
          <Briefcase className="w-3.5 h-3.5" /> صاحب خدمة
        </RoleTabButton>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorBanner && (
          <ErrorBanner message={errorBanner} onClose={() => setErrorBanner(null)} />
        )}
        {(needsEmailConfirmation ||
          (errorBanner && (errorBanner.includes('rate limit') || errorBanner.includes('تجاوز')))) && (
          <EmailConfirmationGuide />
        )}

        <Field label="الاسم الثلاثي" icon={<UserCircle2 className="w-4 h-4" />}>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="مثال: محمد أحمد علي"
            className="pr-10 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card"
            required
          />
        </Field>

        <Field label="رقم الهاتف" icon={<Phone className="w-4 h-4" />}>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="7XX XXX XXX"
            className="pr-10 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card"
            required
            dir="ltr"
          />
        </Field>

        <Field label="رقم الواتساب (اختياري)" icon={<MessageCircle className="w-4 h-4" />}>
          <Input
            type="tel"
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              setWhatsappCopied(false);
            }}
            placeholder="7XX XXX XXX"
            className="pr-10 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card"
            dir="ltr"
          />
          {showCopyButton && (
            <button
              type="button"
              onClick={copyPhoneToWhatsapp}
              className="mt-1.5 w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-semibold hover:bg-emerald-500/20 active:scale-[0.98] transition-all border border-emerald-500/20"
            >
              {whatsappCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  تم نسخ رقم الهاتف
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  استخدام نفس رقم الهاتف
                </>
              )}
            </button>
          )}
        </Field>

        <Field label="المحافظة" icon={<MapPin className="w-4 h-4" />}>
          <Select value={governorate} onValueChange={handleGovernorateChange} required>
            <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card pr-10">
              <SelectValue placeholder="اختر المحافظة" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {YEMEN_GOVERNORATES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {governorate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Navigation className="w-3.5 h-3.5 text-primary" />
                مكان تواجدك للعمل
              </div>
              {locating ? (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  جاري التحديد…
                </span>
              ) : locationStatus === 'ok' ? (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  تم تحديد مكان تواجدك
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void captureLocation(governorate)}
                  className="text-[11px] text-primary font-semibold"
                >
                  إعادة المحاولة
                </button>
              )}
            </div>
            {mapCenter && (
              <LocationPreviewMap
                location={mapCenter}
                zoom={locationStatus === 'ok' ? 15 : getGovernorateCenter(governorate).zoom}
              />
            )}
            {locationStatus === 'denied' && (
              <button
                type="button"
                onClick={() => setShowLocationDialog(true)}
                className="w-full text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-right"
              >
                الموقع غير مفعّل — اضغط لتفعيله وتحديد مكانك في {governorate}
              </button>
            )}
          </div>
        )}

        {role === 'provider' && (
          <>
            <Field label="نوع الخدمة / المجال" icon={<Briefcase className="w-4 h-4" />}>
              <div className="pr-10">
                <ServiceCategoryPicker
                  value={serviceCategory}
                  onChange={setServiceCategory}
                  mode="select"
                  placeholder="اختر التصنيف ثم التخصص"
                />
              </div>
            </Field>

            <Field label="نبذة عن الخدمة (اختياري)" icon={<Sparkles className="w-4 h-4" />}>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اكتب وصفًا موجزًا عن خبراتك وخدماتك…"
                rows={3}
                className="pr-10 rounded-xl bg-muted/40 border-border/60 focus:bg-card resize-none"
              />
            </Field>
          </>
        )}

        <Field label="كلمة السر" icon={<Lock className="w-4 h-4" />}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pr-10 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card"
            required
            minLength={6}
          />
        </Field>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl text-base font-semibold elevate-1"
        >
          {loading ? 'جاري الإنشاء…' : 'إنشاء الحساب'}
        </Button>
      </form>

      <div className="pt-4 text-center text-sm text-muted-foreground">
        لديك حساب؟{' '}
        <button onClick={onLogin} className="text-primary font-semibold hover:underline">
          دخول
        </button>
      </div>

      <LocationEnableDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        governorate={governorate || 'المحافظة المختارة'}
        onEnable={handleEnableLocation}
      />
    </AuthCard>
  );
}


function AuthCard({
  title, subtitle, onBack, children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label, icon, children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <div className="relative">
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {/* Icon for inputs is rendered via the label; keep a subtle visual cue here */}
        </div>
        {children}
      </div>
    </div>
  );
}

function RoleTabButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-card text-foreground elevate-1'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * بانر خطأ متحرك مع إمكانية الإغلاق
 */
function ErrorBanner({
  message, onClose,
}: {
  message: string;
  onClose?: () => void;
}) {
  // كشف أخطاء rate limit لإضافة زر الدليل
  const isRateLimit = message.includes('rate limit') || message.includes('تجاوز');
  const isNeedsConfirm = message.includes('تأكيد') || message.includes('بريد');
  const isCritical = isRateLimit || isNeedsConfirm;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      className={`rounded-xl border p-3 text-xs leading-relaxed ${
        isCritical
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-destructive/5 border-destructive/20 text-destructive'
      }`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={`w-4 h-4 shrink-0 mt-0.5 ${
            isCritical ? 'text-amber-600' : 'text-destructive'
          }`}
        />
        <div className="flex-1 whitespace-pre-line">{message}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 text-current opacity-50 hover:opacity-100"
            aria-label="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * دليل إيقاف تأكيد البريد في Supabase
 * يظهر عند خطأ rate limit أو عند الحاجة لتأكيد البريد
 */
function EmailConfirmationGuide() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs"
    >
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-bold text-amber-900 mb-1.5">
            لإكمال التسجيل: أوقف تأكيد البريد في Supabase
          </div>
          <p className="text-amber-800 leading-relaxed mb-2.5">
            التطبيق يعتمد على رقم الهاتف للدخول، لكن Supabase ما زال يستخدم تأكيداً داخلياً
            قد يسبب خطأ
            <span className="font-mono bg-amber-100 px-1 rounded mx-1">rate limit</span>
            . أوقف خيار التأكيد لتسجيل فوري:
          </p>

          <ol className="space-y-1.5 text-amber-900 mb-3">
            <GuideStep n={1}>
              افتح لوحة تحكم Supabase →{' '}
              <a
                href="https://supabase.com/dashboard/project/mfogdjxvtpvuvxzyyjqn/auth/providers"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-amber-700 underline underline-offset-2 inline-flex items-center gap-0.5"
              >
                Auth Providers
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </GuideStep>
            <GuideStep n={2}>اضغط على <b>Email</b> في القائمة</GuideStep>
            <GuideStep n={3}>
              أطفئ المفتاح <b>Confirm email</b> (اجعله معطّلًا)
            </GuideStep>
            <GuideStep n={4}>اضغط <b>Save</b></GuideStep>
            <GuideStep n={5}>
              عُد هنا واضغط <b>إنشاء الحساب</b> مجددًا — سيعمل فورًا ✅
            </GuideStep>
          </ol>

          <button
            onClick={() => setOpen(false)}
            className="text-amber-700 hover:text-amber-900 text-[11px] underline"
          >
            إخفاء هذا الدليل
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function GuideStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span className="flex-1">{children}</span>
    </li>
  );
}
