'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, type Profile, type UserRole } from '@/lib/supabase';

type AuthState = {
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  signUp: (
    data: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
      governorate: string;
      role: UserRole;
      bio?: string;
      serviceCategory?: string;
    }
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
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
          const { data: signUpData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                full_name: data.fullName,
                phone: data.phone,
                governorate: data.governorate,
                role: data.role,
              },
            },
          });

          if (error) {
            set({ loading: false, error: error.message });
            return { error: error.message };
          }

          if (signUpData.user) {
            const updateData: Record<string, any> = {};
            if (data.bio) updateData.bio = data.bio;
            if (data.serviceCategory) updateData.service_category = data.serviceCategory;
            updateData.full_name = data.fullName;
            updateData.phone = data.phone;
            updateData.governorate = data.governorate;

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
        } catch (e: any) {
          set({ loading: false, error: e.message });
          return { error: e.message };
        }
      },

      signIn: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ loading: false, error: error.message });
            return { error: error.message };
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
        } catch (e: any) {
          set({ loading: false, error: e.message });
          return { error: e.message };
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
