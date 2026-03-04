import { getSubscriptionStatus } from './checkout';
import { getPlan, isPlanHigherOrEqual, getFeatureLimitsForPlan } from './plans';
import type { PlanId, FeatureLimits } from './lib/shared';

export type FeatureName = keyof FeatureLimits;

export async function checkFeatureAccess(
  userId: string,
  feature: FeatureName
): Promise<boolean> {
  const { plan } = await getSubscriptionStatus(userId);
  const limits = getFeatureLimitsForPlan(plan);
  const limit = limits[feature];
  return limit === -1 || limit > 0;
}

export function getFeatureLimits(planId: PlanId): FeatureLimits {
  return getFeatureLimitsForPlan(planId);
}

export async function isWithinLimit(
  userId: string,
  feature: FeatureName,
  currentUsage: number
): Promise<boolean> {
  const { plan } = await getSubscriptionStatus(userId);
  const limits = getFeatureLimitsForPlan(plan);
  const limit = limits[feature];

  if (limit === -1) return true;
  return currentUsage < limit;
}

export interface PlanGuardResult {
  allowed: boolean;
  currentPlan: PlanId;
  requiredPlan: PlanId;
  message?: string;
}

export async function requirePlan(
  userId: string,
  minimumPlan: PlanId
): Promise<PlanGuardResult> {
  const { plan } = await getSubscriptionStatus(userId);

  const allowed = isPlanHigherOrEqual(plan, minimumPlan);

  return {
    allowed,
    currentPlan: plan,
    requiredPlan: minimumPlan,
    message: allowed
      ? undefined
      : `This feature requires the ${getPlan(minimumPlan).name} plan or higher. You are currently on the ${getPlan(plan).name} plan.`,
  };
}
