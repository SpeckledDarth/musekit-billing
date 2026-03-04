# @musekit/billing

Stripe billing module for the MuseKit SaaS platform. This is a standalone npm package providing the complete Stripe billing system (logic/API only, no UI components).

## Tech Stack
- **Runtime**: Node.js 20 with TypeScript (strict mode)
- **Framework**: Express.js dev server on port 5000
- **Billing**: Stripe SDK (development/test mode)
- **Database**: Supabase (profiles + subscriptions tables)
- **Build**: TypeScript compiler, tsx for dev

## Project Structure
```
src/
├── index.ts          # Main export barrel
├── server.ts         # Express dev server (port 5000)
├── stripe.ts         # Stripe client initialization
├── plans.ts          # Plan tier definitions (Starter/Basic/Premium)
├── checkout.ts       # Checkout session, portal, subscription status
├── webhooks.ts       # Stripe webhook handler
├── gating.ts         # Feature access gating and plan guards
├── registry.ts       # Multi-product tier resolution
├── helpers.ts        # Subscription utility helpers
└── lib/
    ├── shared/       # Shared types (local stub for @musekit/shared)
    └── database/     # Supabase client (local stub for @musekit/database)
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
