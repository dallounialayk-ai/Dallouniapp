import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'user' | 'provider';

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  whatsapp_number: string | null;
  email: string;
  governorate: string;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  service_category: string | null;
  created_at: string;
};

export type ServiceRequest = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  governorate: string;
  status: 'open' | 'closed';
  created_at: string;
  profile?: Profile;
  offers_count?: number;
};

export type Offer = {
  id: string;
  request_id: string;
  provider_id: string;
  price: number | null;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  profile?: Profile;
};

export type Review = {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
  review_type: 'provider' | 'request';
  reference_id: string;
  created_at: string;
  profile?: Profile;
};

export type Report = {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  comment: string;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type Conversation = {
  other_user: Profile;
  last_message: Message;
  unread_count: number;
};

export type CatalogItem = {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  image_url: string;
  price: number | null;
  unit: string | null;
  created_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
};
