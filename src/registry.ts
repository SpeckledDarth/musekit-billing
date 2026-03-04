import { getSubscriptionStatus } from './checkout';
import type { PlanId } from './lib/shared';

export interface ProductTierConfig {
  productId: string;
  tiers: {
    tierId: string;
    name: string;
    requiredPlan: PlanId;
    features: string[];
  }[];
}

const productRegistry = new Map<string, ProductTierConfig>();

export function registerProduct(config: ProductTierConfig): void {
  if (productRegistry.has(config.productId)) {
    console.warn(`Product ${config.productId} is already registered, overwriting`);
  }
  productRegistry.set(config.productId, config);
}

export function getRegisteredProduct(productId: string): ProductTierConfig | null {
  return productRegistry.get(productId) || null;
}

export function getAllRegisteredProducts(): ProductTierConfig[] {
  return Array.from(productRegistry.values());
}

export async function resolveUserTier(
  userId: string,
  productId: string
): Promise<{
  tierId: string;
  tierName: string;
  userPlan: PlanId;
} | null> {
  const product = productRegistry.get(productId);
  if (!product) {
    throw new Error(`Product ${productId} is not registered`);
  }

  const { plan } = await getSubscriptionStatus(userId);

  const planHierarchy: PlanId[] = ['starter', 'basic', 'premium'];
  const userPlanIndex = planHierarchy.indexOf(plan);

  let resolvedTier = product.tiers[0];
  for (const tier of product.tiers) {
    const tierPlanIndex = planHierarchy.indexOf(tier.requiredPlan);
    if (tierPlanIndex <= userPlanIndex) {
      resolvedTier = tier;
    }
  }

  if (!resolvedTier) return null;

  return {
    tierId: resolvedTier.tierId,
    tierName: resolvedTier.name,
    userPlan: plan,
  };
}

export function unregisterProduct(productId: string): boolean {
  return productRegistry.delete(productId);
}
