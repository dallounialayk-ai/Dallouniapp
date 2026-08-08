'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, type Profile, type UserRole } from '@/lib/supabase';
import { translateAuthError } from '@/lib/auth-errors';
import { identifierToAuthEmail, normalizeYemenPhone } from '@/lib/phone-auth';

type AuthState = {
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  signUp: (
    data: {
      password: string;
      fullName: string;
      phone: string;
      whatsappNumber?: string;
      governorate: string;
      role: UserRole;
      bio?: string;
      serviceCategory?: string;
      latitude?: number | null;
      longitude?: number | null;
    }
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  /** phone أو بريد قديم */
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  setProfile: (profile: Profile | null) => void;
  setInitialized: (v: boolean) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      profile: null,
      loading: false,
      initialized: false,
      error: null,

      signUp: async (data) => {
        set({ loading: true, error: null });
        try {
          const phoneResult = normalizeYemenPhone(data.phone);
          if (!phoneResult.ok) {
            set({ loading: false, error: phoneResult.message });
            return { error: phoneResult.message };
          }

          let whatsappNormalized: string | null = null;
          if (data.whatsappNumber?.trim()) {
            const wa = normalizeYemenPhone(data.whatsappNumber);
            if (!wa.ok) {
              set({ loading: false, error: `واتساب: ${wa.message}` });
              return { error: `واتساب: ${wa.message}` };
            }
            whatsappNormalized = wa.display;
          }

          const { data: signUpData, error } = await supabase.auth.signUp({
            email: phoneResult.authEmail,
            password: data.password,
            options: {
              data: {
                full_name: data.fullName,
                phone: phoneResult.display,
                governorate: data.governorate,
                role: data.role,
                bio: data.bio ?? null,
                service_category: data.serviceCategory ?? null,
                whatsapp_number: whatsappNormalized,
                latitude: data.latitude ?? null,
                longitude: data.longitude ?? null,
              },
            },
          });

          if (error) {
            const friendly = translateAuthError(error);
            set({ loading: false, error: friendly });
            return { error: friendly };
          }

          if (signUpData.user && !signUpData.session) {
            set({ loading: false });
            return {
              error: 'needs_email_confirmation',
              needsEmailConfirmation: true,
            };
          }

          if (signUpData.user && signUpData.session) {
            const updateData: Record<string, unknown> = {
              full_name: data.fullName,
              phone: phoneResult.display,
              email: phoneResult.display,
              whatsapp_number: whatsappNormalized,
              governorate: data.governorate,
            };
            if (data.bio) updateData.bio = data.bio;
            if (data.serviceCategory) updateData.service_category = data.serviceCategory;
            if (data.latitude != null) updateData.latitude = data.latitude;
            if (data.longitude != null) updateData.longitude = data.longitude;

            if (data.role === 'provider') {
              const { data: setting } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'provider_approval_required')
                .maybeSingle();
              const raw = setting?.value;
              const required =
                typeof raw === 'boolean'
                  ? raw
                  : typeof raw === 'string'
                    ? raw === 'true'
                    : raw === true || raw === 'true';
              if (required) updateData.is_approved = false;
            }

            await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', signUpData.user.id);

            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', signUpData.user.id)
              .single();

            if (profileData) {
              set({ profile: profileData as Profile, loading: false, initialized: true });
              return { error: null };
            }
          }

          set({ loading: false });
          return { error: null };
        } catch (e: unknown) {
          const friendly = translateAuthError(e);
          set({ loading: false, error: friendly });
          return { error: friendly };
        }
      },

      signIn: async (identifier, password) => {
        set({ loading: true, error: null });
        try {
          const idResult = identifierToAuthEmail(identifier);
          if (!idResult.ok) {
            set({ loading: false, error: idResult.message });
            return { error: idResult.message };
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email: idResult.authEmail,
            password,
          });

          if (error) {
            const friendly = translateAuthError(error);
            set({ loading: false, error: friendly });
            return { error: friendly };
          }

          if (data.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError || !profileData) {
              set({ loading: false, error: 'تعذّر تحميل الملف الشخصي' });
              return { error: 'تعذّر تحميل الملف الشخصي' };
            }

            set({ profile: profileData as Profile, loading: false, initialized: true });
            return { error: null };
          }

          set({ loading: false });
          return { error: 'حدث خطأ غير معروف' };
        } catch (e: unknown) {
          const friendly = translateAuthError(e);
          set({ loading: false, error: friendly });
          return { error: friendly };
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ profile: null, initialized: true });
      },

      refreshProfile: async () => {
        const current = get().profile;
        if (!current) return;
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', current.id)
          .single();
        if (data) set({ profile: data as Profile });
      },

      updateProfile: async (patch) => {
        const current = get().profile;
        if (!current) return { error: 'غير مسجّل الدخول' };

        const { error } = await supabase
          .from('profiles')
          .update({
            ...patch,
            updated_at: new Date().toISOString(),
          })
          .eq('id', current.id);

        if (error) return { error: error.message };

        set({ profile: { ...current, ...patch } });
        return { error: null };
      },

      setProfile: (profile) => set({ profile }),
      setInitialized: (v) => set({ initialized: v }),
    }),
    {
      name: 'dallouni-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
