import express from 'express';
import { getAllPlans, getPlan } from './plans';
import { getStripe, getStripePublishableKey } from './stripe';
import type { PlanId } from './lib/shared';

const app = express();
const PORT = 5000;

app.use((req, res, next) => {
  if (req.path === '/api/webhooks/stripe') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.get('/', (_req, res) => {
  const plans = getAllPlans();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@musekit/billing - Module Status</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #f1f5f9; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .status-card { background: #1e293b; border-radius: 12px; padding: 1.25rem; border: 1px solid #334155; }
    .status-card h3 { font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .status-card .value { font-size: 1.5rem; font-weight: 600; }
    .status-card .value.ok { color: #4ade80; }
    .status-card .value.warn { color: #fbbf24; }
    .status-card .value.err { color: #f87171; }
    .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
    .plan-card { background: #1e293b; border-radius: 12px; padding: 1.5rem; border: 1px solid #334155; }
    .plan-card.popular { border-color: #6366f1; }
    .plan-card h2 { font-size: 1.25rem; color: #f1f5f9; margin-bottom: 0.25rem; }
    .plan-card .price { font-size: 2rem; font-weight: 700; color: #818cf8; margin: 0.75rem 0; }
    .plan-card .price span { font-size: 1rem; color: #94a3b8; font-weight: 400; }
    .plan-card ul { list-style: none; padding: 0; }
    .plan-card li { padding: 0.375rem 0; color: #cbd5e1; font-size: 0.875rem; }
    .plan-card li::before { content: "✓ "; color: #4ade80; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; background: #6366f1; color: white; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem; }
    .section-title { font-size: 1.25rem; color: #f1f5f9; margin: 2rem 0 1rem; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; }
    .endpoints { background: #1e293b; border-radius: 12px; padding: 1.5rem; border: 1px solid #334155; }
    .endpoint { padding: 0.75rem 0; border-bottom: 1px solid #1e293b; }
    .endpoint:last-child { border-bottom: none; }
    .method { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; }
    .method.get { background: #065f46; color: #6ee7b7; }
    .method.post { background: #1e3a5f; color: #93c5fd; }
    .endpoint-path { color: #e2e8f0; font-family: monospace; }
    .endpoint-desc { color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>@musekit/billing</h1>
    <p class="subtitle">Stripe Billing Module for MuseKit SaaS Platform</p>

    <div class="status-grid">
      <div class="status-card">
        <h3>Module Status</h3>
        <div class="value ok">Active</div>
      </div>
      <div class="status-card">
        <h3>Stripe Connection</h3>
        <div class="value" id="stripe-status">Checking...</div>
      </div>
      <div class="status-card">
        <h3>Plan Tiers</h3>
        <div class="value ok">${plans.length}</div>
      </div>
      <div class="status-card">
        <h3>Mode</h3>
        <div class="value warn">Development</div>
      </div>
    </div>

    <h2 class="section-title">Plan Tiers</h2>
    <div class="plans-grid">
      ${plans.map(p => `
        <div class="plan-card${p.popular ? ' popular' : ''}">
          <h2>${p.name}${p.popular ? '<span class="badge">Popular</span>' : ''}</h2>
          <p style="color: #94a3b8; font-size: 0.875rem;">${p.description}</p>
          <div class="price">$${p.monthlyPrice}<span>/mo</span></div>
          <ul>
            ${p.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>

    <h2 class="section-title">API Endpoints</h2>
    <div class="endpoints">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="endpoint-path">/api/plans</span>
        <div class="endpoint-desc">List all available plans</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="endpoint-path">/api/plans/:id</span>
        <div class="endpoint-desc">Get details for a specific plan</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="endpoint-path">/api/stripe/status</span>
        <div class="endpoint-desc">Check Stripe connection status</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="endpoint-path">/api/checkout</span>
        <div class="endpoint-desc">Create a checkout session</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="endpoint-path">/api/portal</span>
        <div class="endpoint-desc">Create a customer portal session</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="endpoint-path">/api/webhooks/stripe</span>
        <div class="endpoint-desc">Stripe webhook endpoint</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="endpoint-path">/api/subscription/:userId</span>
        <div class="endpoint-desc">Get user subscription status</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="endpoint-path">/api/gating/:userId/:feature</span>
        <div class="endpoint-desc">Check feature access for user</div>
      </div>
    </div>
  </div>

  <script>
    fetch('/api/stripe/status')
      .then(r => r.json())
      .then(data => {
        const el = document.getElementById('stripe-status');
        if (data.connected) {
          el.textContent = 'Connected';
          el.className = 'value ok';
        } else {
          el.textContent = 'Error';
          el.className = 'value err';
        }
      })
      .catch(() => {
        const el = document.getElementById('stripe-status');
        el.textContent = 'Error';
        el.className = 'value err';
      });
  </script>
</body>
</html>`;
  res.send(html);
});

app.get('/api/plans', (_req, res) => {
  res.json(getAllPlans());
});

app.get('/api/plans/:id', (req, res) => {
  try {
    const plan = getPlan(req.params.id as PlanId);
    res.json(plan);
  } catch {
    res.status(404).json({ error: 'Plan not found' });
  }
});

app.get('/api/stripe/status', async (_req, res) => {
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve();
    res.json({
      connected: true,
      mode: account.charges_enabled ? 'live' : 'test',
      publishableKey: getStripePublishableKey().substring(0, 12) + '...',
    });
  } catch (err: any) {
    res.json({
      connected: false,
      error: err.message,
    });
  }
});

app.post('/api/checkout', async (req, res) => {
  try {
    const { userId, planId, interval, successUrl, cancelUrl } = req.body;
    if (!userId || !planId || !interval) {
      return res.status(400).json({ error: 'Missing required fields: userId, planId, interval' });
    }

    const { createCheckoutSession } = await import('./checkout');
    const url = await createCheckoutSession({
      userId,
      planId,
      interval,
      successUrl: successUrl || `http://localhost:${PORT}/success`,
      cancelUrl: cancelUrl || `http://localhost:${PORT}/cancel`,
    });
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/portal', async (req, res) => {
  try {
    const { userId, returnUrl } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    const { createCustomerPortalSession } = await import('./checkout');
    const url = await createCustomerPortalSession(
      userId,
      returnUrl || `http://localhost:${PORT}/`
    );
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const { verifyWebhookSignature, handleWebhookEvent } = await import('./webhooks');
    const event = verifyWebhookSignature(req.body, signature);
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/subscription/:userId', async (req, res) => {
  try {
    const { getSubscriptionStatus } = await import('./checkout');
    const status = await getSubscriptionStatus(req.params.userId);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/gating/:userId/:feature', async (req, res) => {
  try {
    const { checkFeatureAccess, isWithinLimit } = await import('./gating');
    const { userId, feature } = req.params;
    const currentUsage = parseInt(req.query.usage as string) || 0;

    const hasAccess = await checkFeatureAccess(userId, feature as any);
    const withinLimit = await isWithinLimit(userId, feature as any, currentUsage);

    res.json({ hasAccess, withinLimit, feature, currentUsage });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/subscriptions', async (req, res) => {
  try {
    const { listAllSubscriptions } = await import('./admin');
    const result = await listAllSubscriptions({
      page: parseInt(req.query.page as string) || 1,
      perPage: parseInt(req.query.perPage as string) || 25,
      search: (req.query.search as string) || undefined,
      status: (req.query.status as any) || 'all',
      sortBy: (req.query.sortBy as string) || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/subscriptions/:id', async (req, res) => {
  try {
    const { getSubscriptionDetail } = await import('./admin');
    const detail = await getSubscriptionDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json(detail);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/subscriptions/:id/invoices', async (req, res) => {
  try {
    const { getSubscriptionDetail, getSubscriptionInvoices } = await import('./admin');
    const detail = await getSubscriptionDetail(req.params.id);
    if (!detail?.stripe_subscription_id) {
      return res.json({ invoices: [] });
    }
    const result = await getSubscriptionInvoices(detail.stripe_subscription_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/subscriptions/:id/cancel', async (req, res) => {
  try {
    const { getSubscriptionDetail, cancelSubscription } = await import('./admin');
    const detail = await getSubscriptionDetail(req.params.id);
    if (!detail?.stripe_subscription_id) {
      return res.status(400).json({ error: 'No Stripe subscription found' });
    }
    await cancelSubscription(detail.stripe_subscription_id, req.body.immediate === true);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/subscriptions/:id/change-plan', async (req, res) => {
  try {
    const { getSubscriptionDetail, changeSubscriptionPlan } = await import('./admin');
    const { newPriceId } = req.body;
    if (!newPriceId) {
      return res.status(400).json({ error: 'Missing newPriceId' });
    }
    const detail = await getSubscriptionDetail(req.params.id);
    if (!detail?.stripe_subscription_id) {
      return res.status(400).json({ error: 'No Stripe subscription found' });
    }
    await changeSubscriptionPlan(detail.stripe_subscription_id, newPriceId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/subscriptions/:id/extend-trial', async (req, res) => {
  try {
    const { getSubscriptionDetail, extendTrial } = await import('./admin');
    const { trialEndDate } = req.body;
    if (!trialEndDate) {
      return res.status(400).json({ error: 'Missing trialEndDate' });
    }
    const detail = await getSubscriptionDetail(req.params.id);
    if (!detail?.stripe_subscription_id) {
      return res.status(400).json({ error: 'No Stripe subscription found' });
    }
    await extendTrial(detail.stripe_subscription_id, new Date(trialEndDate));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/subscriptions/:id/credit', async (req, res) => {
  try {
    const { getSubscriptionDetail } = await import('./admin');
    const { applyCredit } = await import('./admin');
    const { amount, description } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Missing amount' });
    }
    const detail = await getSubscriptionDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const supabase = (await import('./lib/database')).getSupabaseAdmin();
    const { data: profile } = await (supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', detail.user_id)
      .single() as any);

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found for user' });
    }

    await applyCredit(profile.stripe_customer_id, amount, description || 'Admin credit');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`@musekit/billing dev server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: development`);
});
