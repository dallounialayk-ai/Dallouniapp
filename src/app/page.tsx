'use client';

import { AuthGate } from '@/components/AuthGate';
import { SchemaChecker } from '@/components/SchemaChecker';
import { MobileShell } from '@/components/MobileShell';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { UserApp } from '@/components/user/UserApp';
import { ProviderApp } from '@/components/provider/ProviderApp';
import { useAuth } from '@/store/auth';

export default function Home() {
  return (
    <MobileShell>
      <AuthGate>
        <SchemaChecker>
          <Root />
        </SchemaChecker>
      </AuthGate>
    </MobileShell>
  );
}

function Root() {
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);

  if (!profile) return <AuthScreen />;

  if (profile.is_blocked) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="w-16 h-16 object-contain" />
        <h2 className="text-lg font-bold">تم إيقاف الحساب</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          تم حظر هذا الحساب من لوحة التحكم. تواصل مع الدعم إن كنت تعتقد أن ذلك خطأ.
        </p>
        <button
          onClick={() => void signOut()}
          className="mt-2 h-11 px-5 rounded-xl border text-sm font-medium"
        >
          تسجيل الخروج
        </button>
      </div>
    );
  }

  if (profile.role === 'provider' && profile.is_approved === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="w-16 h-16 object-contain" />
        <h2 className="text-lg font-bold">حسابك قيد المراجعة</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          تم استلام طلب تسجيلك كمقدم خدمة. ستتمكن من استخدام التطبيق بعد موافقة الإدارة.
        </p>
        <button
          onClick={() => void signOut()}
          className="mt-2 h-11 px-5 rounded-xl border text-sm font-medium"
        >
          تسجيل الخروج
        </button>
      </div>
    );
  }

  if (profile.role === 'provider') return <ProviderApp />;
  return <UserApp />;
}
