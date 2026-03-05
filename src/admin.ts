import { getStripe } from './stripe';
import { getSupabaseAdmin } from './lib/database';
import type { Subscription, SubscriptionStatus } from './lib/shared';

export interface SubscriptionWithUser extends Subscription {
  user_email: string | null;
  user_name: string | null;
}

export interface ListSubscriptionsOptions {
  page?: number;
  perPage?: number;
  search?: string;
  status?: SubscriptionStatus | 'all';
  planTier?: string | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListSubscriptionsResult {
  subscriptions: SubscriptionWithUser[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function listAllSubscriptions(
  options: ListSubscriptionsOptions = {}
): Promise<ListSubscriptionsResult> {
  const {
    page = 1,
    perPage = 25,
    search,
    status = 'all',
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  const supabase = getSupabaseAdmin();
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('muse_product_subscriptions')
    .select('*, profiles!inner(email, full_name)', { count: 'exact' });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(
      `profiles.email.ilike.%${search}%,profiles.full_name.ilike.%${search}%`
    );
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  query = query.range(offset, offset + perPage - 1);

  const { data, count, error } = await (query as any);

  if (error) {
    console.error('Error listing subscriptions:', error);
    throw error;
  }

  const subscriptions: SubscriptionWithUser[] = (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    product_slug: row.product_slug,
    stripe_subscription_id: row.stripe_subscription_id,
    stripe_price_id: row.stripe_price_id,
    tier_id: row.tier_id,
    status: row.status,
    current_period_end: row.current_period_end,
    cancel_at_period_end: row.cancel_at_period_end,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user_email: row.profiles?.email || null,
    user_name: row.profiles?.full_name || null,
  }));

  const total = count || 0;

  return {
    subscriptions,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getSubscriptionDetail(
  subscriptionId: string
): Promise<SubscriptionWithUser | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await (supabase
    .from('muse_product_subscriptions')
    .select('*, profiles!inner(email, full_name)')
    .eq('id', subscriptionId)
    .single() as any);

  if (error || !data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    product_slug: data.product_slug,
    stripe_subscription_id: data.stripe_subscription_id,
    stripe_price_id: data.stripe_price_id,
    tier_id: data.tier_id,
    status: data.status,
    current_period_end: data.current_period_end,
    cancel_at_period_end: data.cancel_at_period_end,
    created_at: data.created_at,
    updated_at: data.updated_at,
    user_email: data.profiles?.email || null,
    user_name: data.profiles?.full_name || null,
  };
}

export async function cancelSubscription(
  stripeSubscriptionId: string,
  immediate: boolean = false
): Promise<void> {
  const stripe = getStripe();

  if (immediate) {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  } else {
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }
}

export async function changeSubscriptionPlan(
  stripeSubscriptionId: string,
  newPriceId: string
): Promise<void> {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const sub = subscription as any;
  const itemId = sub.items?.data?.[0]?.id;

  if (!itemId) {
    throw new Error('No subscription item found');
  }

  await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: 'create_prorations',
  });
}

export async function extendTrial(
  stripeSubscriptionId: string,
  trialEndDate: Date
): Promise<void> {
  const stripe = getStripe();

  await stripe.subscriptions.update(stripeSubscriptionId, {
    trial_end: Math.floor(trialEndDate.getTime() / 1000),
  });
}

export async function applyCredit(
  stripeCustomerId: string,
  amount: number,
  description: string
): Promise<void> {
  const stripe = getStripe();

  await stripe.customers.createBalanceTransaction(stripeCustomerId, {
    amount: -Math.abs(amount),
    currency: 'usd',
    description,
  });
}

export async function getSubscriptionInvoices(
  stripeSubscriptionId: string
): Promise<{
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string | null;
    created: number;
    period_start: number;
    period_end: number;
    hosted_invoice_url: string | null;
  }>;
}> {
  const stripe = getStripe();

  const invoices = await stripe.invoices.list({
    subscription: stripeSubscriptionId,
    limit: 50,
  });

  return {
    invoices: invoices.data.map((inv: any) => ({
      id: inv.id,
      amount: inv.amount_paid || inv.total || 0,
      currency: inv.currency || 'usd',
      status: inv.status,
      created: inv.created,
      period_start: inv.period_start,
      period_end: inv.period_end,
      hosted_invoice_url: inv.hosted_invoice_url || null,
    })),
  };
}
