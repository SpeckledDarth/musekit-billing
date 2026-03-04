import type { PlanId, PlanConfig, FeatureLimits } from './lib/shared';

export interface PlanTier {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
  features: string[];
  limits: FeatureLimits;
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanTier> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Get started with basic features',
    monthlyPrice: 0,
    annualPrice: 0,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    features: [
      'Up to 5 posts',
      '1 social account',
      '1 team member',
      '1 GB storage',
      '100 API calls/day',
    ],
    limits: {
      posts: 5,
      accounts: 1,
      team_members: 1,
      storage_gb: 1,
      api_calls: 100,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Expanded limits for growing teams',
    monthlyPrice: 29,
    annualPrice: 290,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_BASIC_ANNUAL || '',
    features: [
      'Up to 50 posts',
      '5 social accounts',
      '5 team members',
      '10 GB storage',
      '1,000 API calls/day',
    ],
    limits: {
      posts: 50,
      accounts: 5,
      team_members: 5,
      storage_gb: 10,
      api_calls: 1000,
    },
    popular: true,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Unlimited access for professionals',
    monthlyPrice: 99,
    annualPrice: 990,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || '',
    features: [
      'Unlimited posts',
      'Unlimited social accounts',
      'Unlimited team members',
      '100 GB storage',
      'Unlimited API calls',
    ],
    limits: {
      posts: -1,
      accounts: -1,
      team_members: -1,
      storage_gb: 100,
      api_calls: -1,
    },
  },
};

export function getPlan(planId: PlanId): PlanTier {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return plan;
}

export function getPlanByPriceId(priceId: string): PlanTier | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceIdMonthly === priceId || plan.stripePriceIdAnnual === priceId) {
      return plan;
    }
  }
  return null;
}

export function getAllPlans(): PlanTier[] {
  return Object.values(PLANS);
}

export function getFeatureLimitsForPlan(planId: PlanId): FeatureLimits {
  return getPlan(planId).limits;
}

export const PLAN_HIERARCHY: PlanId[] = ['starter', 'basic', 'premium'];

export function isPlanHigherOrEqual(currentPlan: PlanId, requiredPlan: PlanId): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
  return currentIndex >= requiredIndex;
}
