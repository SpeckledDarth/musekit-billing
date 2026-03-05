export { getStripe, getStripePublishableKey } from './stripe';

export {
  PLANS,
  getPlan,
  getPlanByPriceId,
  getAllPlans,
  getFeatureLimitsForPlan,
  PLAN_HIERARCHY,
  isPlanHigherOrEqual,
} from './plans';
export type { PlanTier } from './plans';

export {
  createCheckoutSession,
  createCustomerPortalSession,
  getSubscriptionStatus,
} from './checkout';
export type { CheckoutSessionOptions } from './checkout';

export {
  verifyWebhookSignature,
  handleWebhookEvent,
} from './webhooks';

export {
  checkFeatureAccess,
  getFeatureLimits,
  isWithinLimit,
  requirePlan,
} from './gating';
export type { FeatureName, PlanGuardResult } from './gating';

export {
  registerProduct,
  getRegisteredProduct,
  getAllRegisteredProducts,
  resolveUserTier,
  unregisterProduct,
} from './registry';
export type { ProductTierConfig } from './registry';

export {
  isActive,
  isPastDue,
  isCanceled,
  isTrialing,
  daysUntilRenewal,
  formatPlanName,
  formatPrice,
  isSubscriptionValid,
  getSubscriptionEndDate,
} from './helpers';

export {
  listAllSubscriptions,
  getSubscriptionDetail,
  cancelSubscription,
  changeSubscriptionPlan,
  extendTrial,
  applyCredit,
  getSubscriptionInvoices,
} from './admin';
export type {
  SubscriptionWithUser,
  ListSubscriptionsOptions,
  ListSubscriptionsResult,
} from './admin';

export { logAuditEvent } from './audit';
export type { AuditLogEntry } from './audit';

export {
  getPricingMetadata,
  getPricingSchema,
} from './seo';
export type {
  PricingMetadataOptions,
  PricingSchema,
  PricingSchemaOffer,
} from './seo';

export {
  SubscriptionDetail,
  SubscriptionList,
  PricingPage,
} from './components';
export type {
  SubscriptionDetailProps,
  SubscriptionDetailData,
  SubscriptionListProps,
  SubscriptionListItem,
  PricingPageProps,
} from './components';

export type {
  Database,
  Subscription,
  SubscriptionStatus,
  PlanId,
  PlanConfig,
  FeatureLimits,
} from './lib/shared';
