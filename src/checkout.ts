import { getStripe } from './stripe';
import { getPlan, getPlanByPriceId } from './plans';
import { getSupabaseAdmin } from './lib/database';
import type { PlanId, Subscription } from './lib/shared';

export interface CheckoutSessionOptions {
  userId: string;
  planId: PlanId;
  interval: 'month' | 'year';
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(options: CheckoutSessionOptions): Promise<string> {
  const { userId, planId, interval, successUrl, cancelUrl } = options;
  const stripe = getStripe();
  const supabase = getSupabaseAdmin();
  const plan = getPlan(planId);

  if (planId === 'starter') {
    throw new Error('Cannot create checkout for free plan');
  }

  const priceId = interval === 'month' ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;
  if (!priceId) {
    throw new Error(`No Stripe price configured for ${planId} (${interval})`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .single();

  const profileData = profile as Record<string, any> | null;
  let customerId = profileData?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profileData?.email || undefined,
      metadata: { userId },
    });
    customerId = customer.id;

    await (supabase
      .from('profiles') as any)
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, planId },
    subscription_data: {
      metadata: { userId, planId },
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return session.url;
}

export async function createCustomerPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  const profileData = profile as Record<string, any> | null;

  if (!profileData?.stripe_customer_id) {
    throw new Error('No Stripe customer found for this user');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profileData.stripe_customer_id,
    return_url: returnUrl,
  });

  return session.url;
}

export async function getSubscriptionStatus(userId: string): Promise<{
  subscription: Subscription | null;
  plan: PlanId;
  isActive: boolean;
}> {
  const supabase = getSupabaseAdmin();

  const { data: subscription } = await supabase
    .from('muse_product_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!subscription) {
    return {
      subscription: null,
      plan: 'starter',
      isActive: true,
    };
  }

  const subData = subscription as unknown as Subscription;
  const isActive = ['active', 'trialing'].includes(subData.status);

  let plan: PlanId = 'starter';
  if (isActive && subData.stripe_price_id) {
    const resolvedPlan = getPlanByPriceId(subData.stripe_price_id);
    plan = resolvedPlan?.id || 'starter';
  }

  return {
    subscription: subData,
    plan,
    isActive,
  };
}
