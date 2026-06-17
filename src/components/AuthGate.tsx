'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';

/**
 * Initializes the auth state on mount and keeps it in sync with Supabase session.
 * Must be rendered once near the root of the app.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const setProfile = useAuth((s) => s.setProfile);
  const setInitialized = useAuth((s) => s.setInitialized);
  const profile = useAuth((s) => s.profile);
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
          if (mounted && profileData) {
            setProfile(profileData as any);
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
        if (profileData) setProfile(profileData as any);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">جاري التحميل…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
