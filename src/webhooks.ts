import Stripe from 'stripe';
import { getStripe } from './stripe';
import { getSupabaseAdmin } from './lib/database';
import { getPlanByPriceId } from './plans';

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`Unhandled webhook event: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const supabase = getSupabaseAdmin();
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in checkout session metadata');
    return;
  }

  const stripe = getStripe();
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.error('No subscription found in checkout session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const sub = subscription as any;

  const stripePriceId = sub.items?.data?.[0]?.price?.id || null;

  const { error } = await (supabase.from('muse_product_subscriptions') as any).upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: stripePriceId,
      status: sub.status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseAdmin();
  const sub = subscription as any;
  const userId = sub.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const stripePriceId = sub.items?.data?.[0]?.price?.id || null;

  const { error } = await (supabase.from('muse_product_subscriptions') as any)
    .update({
      status: sub.status,
      stripe_price_id: stripePriceId,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseAdmin();
  const sub = subscription as any;
  const userId = sub.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const { error } = await (supabase.from('muse_product_subscriptions') as any)
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const supabase = getSupabaseAdmin();
  const inv = invoice as any;
  const subscriptionId = inv.subscription as string;

  if (!subscriptionId) return;

  const { error } = await (supabase.from('muse_product_subscriptions') as any)
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error recording payment success:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const supabase = getSupabaseAdmin();
  const inv = invoice as any;
  const subscriptionId = inv.subscription as string;

  if (!subscriptionId) return;

  const { error } = await (supabase.from('muse_product_subscriptions') as any)
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error recording payment failure:', error);
    throw error;
  }
}
