# @musekit/billing

The billing module for the MuseKit SaaS platform. Provides complete Stripe billing integration including checkout, webhooks, feature gating, subscription management, admin actions, UI components, and SEO helpers.

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

### Admin Actions
- `listAllSubscriptions(options)` — List subscriptions with pagination, search, filters, sorting (joined with profiles)
- `getSubscriptionDetail(subscriptionId)` — Get full subscription detail with user info
- `cancelSubscription(stripeSubscriptionId, immediate?)` — Cancel via Stripe (end-of-period or immediate)
- `changeSubscriptionPlan(stripeSubscriptionId, newPriceId)` — Upgrade/downgrade plan
- `extendTrial(stripeSubscriptionId, trialEndDate)` — Extend trial period
- `applyCredit(stripeCustomerId, amount, description)` — Apply credit balance
- `getSubscriptionInvoices(stripeSubscriptionId)` — List invoices for a subscription

### Helpers
- `isActive(subscription)` — Is subscription active?
- `isPastDue(subscription)` — Is payment past due?
- `isCanceled(subscription)` — Is subscription canceled?
- `isTrialing(subscription)` — Is subscription in trial?
- `daysUntilRenewal(subscription)` — Days until renewal
- `formatPlanName(planId)` — Human-readable plan name
- `formatPrice(amount, interval)` — Formatted price string

### SEO
- `getPricingMetadata(options?)` — Next.js Metadata for pricing page (title, description, OpenGraph, Twitter cards)
- `getPricingSchema(plans?, options?)` — JSON-LD Product structured data with Offer items for Google rich results

### Components
All components use `"use client"` directive and Tailwind CSS classes.

#### SubscriptionDetail
Slide-over panel displaying full subscription info with admin actions.
```tsx
<SubscriptionDetail
  subscriptionId="..."
  onClose={() => {}}
  apiBasePath="/api/admin"
  onUpdated={() => refetch()}
/>
```

#### SubscriptionList
Sortable, filterable subscription table with bulk operations.
```tsx
<SubscriptionList
  apiBasePath="/api/admin"
  onSelectSubscription={(sub) => setSelected(sub)}
/>
```

#### PricingPage
Public pricing page with Stripe checkout integration.
```tsx
<PricingPage
  plans={getAllPlans()}
  userId={session?.user?.id}
  checkoutApiPath="/api/checkout"
  currentPlan="starter"
/>
```

## Plan Tiers

| Plan | Monthly | Annual | Posts | Accounts | Team | Storage | API Calls |
|------|---------|--------|-------|----------|------|---------|-----------|
| Starter | $0 | $0 | 5 | 1 | 1 | 1 GB | 100/day |
| Basic | $29 | $290 | 50 | 5 | 5 | 10 GB | 1,000/day |
| Premium | $99 | $990 | Unlimited | Unlimited | Unlimited | 100 GB | Unlimited |

## Supabase Tables

### muse_product_subscriptions
Stores subscription records linked to Stripe. Columns: `id`, `user_id`, `product_slug`, `stripe_subscription_id`, `stripe_price_id`, `tier_id`, `status`, `current_period_end`, `cancel_at_period_end`, `created_at`, `updated_at`.

### profiles
User profiles with `stripe_customer_id` for Stripe customer linkage.

## Webhook Events Handled
- `checkout.session.completed` — Create/update subscription
- `customer.subscription.updated` — Sync plan changes
- `customer.subscription.deleted` — Mark canceled
- `invoice.payment_succeeded` — Record payment
- `invoice.payment_failed` — Mark past due
