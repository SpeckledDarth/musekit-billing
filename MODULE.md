# @musekit/billing

The billing module for the MuseKit SaaS platform. Provides complete Stripe billing integration including checkout, webhooks, feature gating, and subscription management.

## Installation

```bash
npm install @musekit/billing
```

## Exports

### Stripe Client
- `getStripe()` — Server-side Stripe instance
- `getStripePublishableKey()` — Client-side publishable key

### Plans
- `PLANS` — Plan tier definitions (starter, basic, premium)
- `getPlan(planId)` — Get a specific plan
- `getAllPlans()` — Get all plans
- `getPlanByPriceId(priceId)` — Resolve plan from Stripe price ID
- `isPlanHigherOrEqual(current, required)` — Compare plan tiers

### Checkout
- `createCheckoutSession(options)` — Create Stripe checkout
- `createCustomerPortalSession(userId, returnUrl)` — Open billing portal
- `getSubscriptionStatus(userId)` — Get current subscription

### Webhooks
- `verifyWebhookSignature(payload, signature)` — Verify Stripe webhook
- `handleWebhookEvent(event)` — Process webhook events

### Feature Gating
- `checkFeatureAccess(userId, feature)` — Can user access feature?
- `getFeatureLimits(planId)` — Get limits for a plan
- `isWithinLimit(userId, feature, currentUsage)` — Check usage limits
- `requirePlan(userId, minimumPlan)` — Guard requiring minimum plan

### Product Registry
- `registerProduct(config)` — Register product tier structure
- `resolveUserTier(userId, productId)` — Resolve user's product tier
- `getRegisteredProduct(productId)` — Get registered product
- `getAllRegisteredProducts()` — List all products

### Helpers
- `isActive(subscription)` — Is subscription active?
- `isPastDue(subscription)` — Is payment past due?
- `isCanceled(subscription)` — Is subscription canceled?
- `isTrialing(subscription)` — Is subscription in trial?
- `daysUntilRenewal(subscription)` — Days until renewal
- `formatPlanName(planId)` — Human-readable plan name
- `formatPrice(amount, interval)` — Formatted price string

## Plan Tiers

| Plan | Monthly | Annual | Posts | Accounts | Team | Storage | API Calls |
|------|---------|--------|-------|----------|------|---------|-----------|
| Starter | $0 | $0 | 5 | 1 | 1 | 1 GB | 100/day |
| Basic | $29 | $290 | 50 | 5 | 5 | 10 GB | 1,000/day |
| Premium | $99 | $990 | Unlimited | Unlimited | Unlimited | 100 GB | Unlimited |

## Supabase Tables

### subscriptions
Stores subscription records linked to Stripe.

### profiles
User profiles with `stripe_customer_id` for Stripe customer linkage.

## Webhook Events Handled
- `checkout.session.completed` — Create/update subscription
- `customer.subscription.updated` — Sync plan changes
- `customer.subscription.deleted` — Mark canceled
- `invoice.payment_succeeded` — Record payment
- `invoice.payment_failed` — Mark past due
