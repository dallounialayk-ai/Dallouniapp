'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Wrench, User, Building2, ArrowRight, ArrowLeft,
  Phone, Mail, Lock, MapPin, UserCircle2, Briefcase,
  Sparkles, Shield, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { APP_NAME, APP_TAGLINE, YEMEN_GOVERNORATES, SERVICE_CATEGORIES } from '@/lib/constants';
import type { UserRole } from '@/lib/supabase';

type Mode = 'select' | 'login' | 'register';
type RegisterRole = 'user' | 'provider';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('select');
  const [pendingRole, setPendingRole] = useState<RegisterRole>('user');

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/[0.04]">
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/40 blur-3xl" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Brand */}
        <header className="px-6 pt-10 pb-4 flex items-center justify-center">
          <BrandMark />
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-10">
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
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center elevate-2">
        <Home className="w-8 h-8 text-white" strokeWidth={2.2} />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-white elevate-1 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
        </div>
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const { error } = await signIn(email, password);
    if (error) toast.error(error);
  };

  return (
    <AuthCard
      title="تسجيل الدخول"
      subtitle="أهلاً بعودتك 👋"
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="البريد الإلكتروني" icon={<Mail className="w-4 h-4" />}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
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
  const [email, setEmail] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [password, setPassword] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !email || !governorate || !password) {
      toast.error('الرجاء إكمال جميع الحقول المطلوبة');
      return;
    }
    if (role === 'provider' && !serviceCategory) {
      toast.error('الرجاء اختيار نوع الخدمة');
      return;
    }
    const { error } = await signUp({
      email,
      password,
      fullName,
      phone,
      governorate,
      role: role as UserRole,
      bio: role === 'provider' ? bio : undefined,
      serviceCategory: role === 'provider' ? serviceCategory : undefined,
    });
    if (error) toast.error(error);
  };

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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="7XX XXX XXX"
            className="pr-10 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card"
            required
            dir="ltr"
          />
        </Field>

        <Field label="البريد الإلكتروني" icon={<Mail className="w-4 h-4" />}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="pr-10 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card"
            required
            dir="ltr"
          />
        </Field>

        <Field label="المحافظة" icon={<MapPin className="w-4 h-4" />}>
          <Select value={governorate} onValueChange={setGovernorate} required>
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

        {role === 'provider' && (
          <>
            <Field label="نوع الخدمة / المجال" icon={<Briefcase className="w-4 h-4" />}>
              <Select value={serviceCategory} onValueChange={setServiceCategory} required>
                <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-card pr-10">
                  <SelectValue placeholder="اختر نوع الخدمة" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {SERVICE_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
