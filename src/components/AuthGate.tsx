'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { SplashScreen } from '@/components/SplashScreen';

/**
 * Initializes the auth state on mount and keeps it in sync with Supabase session.
 * Must be rendered once near the root of the app.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const setProfile = useAuth((s) => s.setProfile);
  const setInitialized = useAuth((s) => s.setInitialized);
  const initialized = useAuth((s) => s.initialized);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
          if (mounted) {
            // Clear stale persisted profile if fetch fails
            setProfile(profileData ? (profileData as any) : null);
          }
        } else {
          if (mounted) setProfile(null);
        }
      } catch (e) {
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setInitialized(true);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData ? (profileData as any) : null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!initialized) {
    return <SplashScreen message="جاري تجهيز حسابك…" />;
  }

  return <>{children}</>;
}
