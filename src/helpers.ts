import type { Subscription, PlanId } from './lib/shared';
import { getPlan } from './plans';

export function isActive(subscription: Subscription): boolean {
  return subscription.status === 'active';
}

export function isPastDue(subscription: Subscription): boolean {
  return subscription.status === 'past_due';
}

export function isCanceled(subscription: Subscription): boolean {
  return subscription.status === 'canceled';
}

export function isTrialing(subscription: Subscription): boolean {
  return subscription.status === 'trialing';
}

export function daysUntilRenewal(subscription: Subscription): number {
  if (!subscription.current_period_end) return 0;

  const endDate = new Date(subscription.current_period_end);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function formatPlanName(planId: PlanId): string {
  const plan = getPlan(planId);
  return plan.name;
}

export function formatPrice(amount: number, interval: 'month' | 'year'): string {
  if (amount === 0) return 'Free';
  return `$${amount}/${interval === 'month' ? 'mo' : 'yr'}`;
}

export function isSubscriptionValid(subscription: Subscription): boolean {
  return ['active', 'trialing'].includes(subscription.status);
}

export function getSubscriptionEndDate(subscription: Subscription): Date | null {
  if (!subscription.current_period_end) return null;
  return new Date(subscription.current_period_end);
}
