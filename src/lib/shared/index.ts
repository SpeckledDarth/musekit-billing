export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface ProfileRow {
  id: string;
  stripe_customer_id: string | null;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

interface MuseProductSubscriptionRow {
  id: string;
  user_id: string;
  product_slug: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  tier_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
      };
      muse_product_subscriptions: {
        Row: MuseProductSubscriptionRow;
        Insert: Partial<MuseProductSubscriptionRow> & {
          user_id: string;
          status: string;
        };
        Update: Partial<MuseProductSubscriptionRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';

export interface Subscription {
  id: string;
  user_id: string;
  product_slug: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  tier_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type PlanId = 'starter' | 'basic' | 'premium';

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: FeatureLimits;
}

export interface FeatureLimits {
  posts: number;
  accounts: number;
  team_members: number;
  storage_gb: number;
  api_calls: number;
}
