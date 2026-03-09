# @musekit/billing

Stripe billing module for the MuseKit SaaS platform. Provides complete Stripe billing system including checkout, webhooks, feature gating, subscription management, admin actions, UI components, and SEO helpers.

## Tech Stack
- **Runtime**: Node.js 20 with TypeScript (strict mode)
- **Framework**: Express.js dev server on port 5000
- **Billing**: Stripe SDK (development/test mode)
- **Database**: Supabase (profiles + muse_product_subscriptions tables)
- **UI**: React 18 components with semantic Tailwind CSS classes (CSS variable-based: bg-card, text-foreground, border-border, bg-primary, text-success, text-danger, text-warning, etc.), sonner (toasts), lucide-react (icons). Requires consuming app to have ThemeInjector (Prompt 38) and design-system shared preset (Prompt 39) active.
- **Build**: TypeScript compiler, tsx for dev

## Project Structure
```
src/
├── index.ts                    # Main export barrel
├── server.ts                   # Express dev server (port 5000)
├── stripe.ts                   # Stripe client initialization
├── plans.ts                    # Plan tier definitions (Starter/Basic/Premium)
├── checkout.ts                 # Checkout session, portal, subscription status
├── webhooks.ts                 # Stripe webhook handler (all mutations emit audit logs)
├── gating.ts                   # Feature access gating and plan guards
├── registry.ts                 # Multi-product tier resolution
├── helpers.ts                  # Subscription utility helpers
├── admin.ts                    # Admin Stripe actions (cancel, change plan, extend trial, credit, list)
├── audit.ts                    # Audit logging for admin mutations (DB + console fallback)
├── seo.ts                      # SEO metadata and JSON-LD structured data helpers
├── components/
│   ├── index.ts                # Component barrel export
│   ├── SubscriptionDetail.tsx  # Subscription detail slide-over with admin actions
│   ├── SubscriptionList.tsx    # Sortable/filterable subscription table with bulk ops
│   └── PricingPage.tsx         # Public pricing page with Stripe checkout integration
└── lib/
    ├── shared/                 # Shared types (local stub for @musekit/shared)
    └── database/               # Supabase client (local stub for @musekit/database)
```

## Environment Secrets
- STRIPE_SECRET_KEY — Stripe test secret key
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — Stripe test publishable key
- NEXT_PUBLIC_SUPABASE_URL — Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key
- SUPABASE_SERVICE_ROLE_KEY — Supabase service role key

## Running
- `npm run dev` — starts the dev server with hot reload on port 5000
- `npm run build` — compiles TypeScript to dist/
- `npm run typecheck` — type-check without emitting

## API Endpoints (Dev Server)
- GET `/` — Module status dashboard
- GET `/api/plans` — List all plans
- GET `/api/plans/:id` — Get plan details
- GET `/api/stripe/status` — Check Stripe connection
- POST `/api/checkout` — Create checkout session
- POST `/api/portal` — Create customer portal session
- POST `/api/webhooks/stripe` — Stripe webhook endpoint
- GET `/api/subscription/:userId` — Get subscription status
- GET `/api/gating/:userId/:feature` — Check feature access
- GET `/api/admin/subscriptions` — List subscriptions (paginated, searchable, filterable)
- GET `/api/admin/subscriptions/:id` — Get subscription detail
- GET `/api/admin/subscriptions/:id/invoices` — Get subscription invoices
- POST `/api/admin/subscriptions/:id/cancel` — Cancel subscription
- POST `/api/admin/subscriptions/:id/change-plan` — Change subscription plan
- POST `/api/admin/subscriptions/:id/extend-trial` — Extend trial period
- POST `/api/admin/subscriptions/:id/credit` — Apply credit to customer

## Components
All components use "use client" directive and are designed for Next.js 14 integration.
- **SubscriptionDetail** — Slide-over panel showing subscription info (plan name, MRR), payment history, status timeline, navigable breadcrumb, and admin actions (cancel, change plan, extend trial, apply credit) with confirmation dialogs. All admin actions emit audit log entries. Accessible: role="dialog", aria-modal, aria-labels on icon buttons, Escape key to close.
- **SubscriptionList** — Data table with column sorting (User, Plan, MRR, Status, Created, Period End), search, status filter, plan tier filter (All/Starter/Basic/Premium), pagination (25/page, URL-persisted), bulk cancel with floating action bar, CSV export (includes Plan and MRR columns), and clickable rows. Accessible: keyboard-navigable rows (Enter/Space), Escape to close dialogs, role="dialog" on bulk cancel modal.
- **PricingPage** — Responsive pricing grid with monthly/annual toggle, Stripe checkout integration, login-aware CTAs

## SEO Exports
- `getPricingMetadata()` — Returns Next.js Metadata for pricing page (title, description, OpenGraph, Twitter)
- `getPricingSchema()` — Returns JSON-LD Product structured data with pricing Offers
