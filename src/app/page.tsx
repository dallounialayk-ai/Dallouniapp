'use client';

import { AuthGate } from '@/components/AuthGate';
import { SchemaChecker } from '@/components/SchemaChecker';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { UserApp } from '@/components/user/UserApp';
import { ProviderApp } from '@/components/provider/ProviderApp';
import { useAuth } from '@/store/auth';

export default function Home() {
  return (
    <AuthGate>
      <SchemaChecker>
        <Root />
      </SchemaChecker>
    </AuthGate>
  );
}

function Root() {
  const profile = useAuth((s) => s.profile);

  if (!profile) return <AuthScreen />;
  if (profile.role === 'provider') return <ProviderApp />;
  return <UserApp />;
}
