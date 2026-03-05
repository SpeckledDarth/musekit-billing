"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  X,
  Calendar,
  CreditCard,
  User,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Loader2,
} from 'lucide-react';

export interface SubscriptionDetailData {
  id: string;
  user_id: string;
  product_slug: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  tier_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  user_email: string | null;
  user_name: string | null;
  plan_name: string | null;
  mrr: number;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string | null;
  created: number;
  period_start: number;
  period_end: number;
  hosted_invoice_url: string | null;
}

export interface SubscriptionDetailProps {
  subscriptionId: string;
  onClose: () => void;
  apiBasePath?: string;
  onUpdated?: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    trialing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    past_due: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    canceled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    incomplete: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.incomplete}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(dateStr: string | number) {
  const d = typeof dateStr === 'number' ? new Date(dateStr * 1000) : new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount: number, currency: string = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function relativeTime(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="flex justify-between">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

export function SubscriptionDetail({
  subscriptionId,
  onClose,
  apiBasePath = '/api/admin',
  onUpdated,
}: SubscriptionDetailProps) {
  const [subscription, setSubscription] = useState<SubscriptionDetailData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [newPriceId, setNewPriceId] = useState('');
  const [showExtendTrialDialog, setShowExtendTrialDialog] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState('');
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCancelDialog) setShowCancelDialog(false);
        else if (showChangePlanDialog) setShowChangePlanDialog(false);
        else if (showExtendTrialDialog) setShowExtendTrialDialog(false);
        else if (showCreditDialog) setShowCreditDialog(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showCancelDialog, showChangePlanDialog, showExtendTrialDialog, showCreditDialog]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        fetch(`${apiBasePath}/subscriptions/${subscriptionId}`),
        fetch(`${apiBasePath}/subscriptions/${subscriptionId}/invoices`),
      ]);

      if (subRes.ok) {
        setSubscription(await subRes.json());
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data.invoices || []);
      }
    } catch {
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  }, [apiBasePath, subscriptionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    action: string,
    url: string,
    body: Record<string, unknown>,
    successMsg: string
  ) => {
    setActionLoading(action);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Action failed');
      }
      toast.success(successMsg);
      fetchData();
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = () => {
    if (!subscription?.stripe_subscription_id) return;
    handleAction(
      'cancel',
      `${apiBasePath}/subscriptions/${subscriptionId}/cancel`,
      { immediate: cancelImmediate },
      cancelImmediate ? 'Subscription canceled immediately' : 'Subscription set to cancel at period end'
    );
    setShowCancelDialog(false);
  };

  const handleChangePlan = () => {
    if (!subscription?.stripe_subscription_id || !newPriceId) return;
    handleAction(
      'changePlan',
      `${apiBasePath}/subscriptions/${subscriptionId}/change-plan`,
      { newPriceId },
      'Plan changed successfully'
    );
    setShowChangePlanDialog(false);
    setNewPriceId('');
  };

  const handleExtendTrial = () => {
    if (!subscription?.stripe_subscription_id || !trialEndDate) return;
    handleAction(
      'extendTrial',
      `${apiBasePath}/subscriptions/${subscriptionId}/extend-trial`,
      { trialEndDate },
      'Trial extended successfully'
    );
    setShowExtendTrialDialog(false);
    setTrialEndDate('');
  };

  const handleApplyCredit = () => {
    if (!creditAmount) return;
    handleAction(
      'credit',
      `${apiBasePath}/subscriptions/${subscriptionId}/credit`,
      { amount: Math.round(parseFloat(creditAmount) * 100), description: creditDescription },
      'Credit applied successfully'
    );
    setShowCreditDialog(false);
    setCreditAmount('');
    setCreditDescription('');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl overflow-y-auto">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Not Found</h2>
            <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400">The requested subscription could not be found.</p>
        </div>
      </div>
    );
  }

  const timelineEvents = [
    { label: 'Created', date: subscription.created_at, icon: Calendar },
    ...(subscription.current_period_end
      ? [{ label: 'Period Ends', date: subscription.current_period_end, icon: Clock }]
      : []),
    ...(subscription.cancel_at_period_end
      ? [{ label: 'Scheduled Cancellation', date: subscription.current_period_end || subscription.updated_at, icon: AlertTriangle }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label="Subscription details">
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl overflow-y-auto outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center z-10">
          <div>
            <nav className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <button onClick={onClose} className="hover:text-gray-700 dark:hover:text-gray-200 underline">Subscriptions</button>
              <span>/</span>
              <span>Detail</span>
            </nav>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Subscription Details
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close subscription details"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</label>
              <div className="mt-1 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{subscription.user_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{subscription.user_email || 'No email'}</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</label>
              <div className="mt-1">
                <StatusBadge status={subscription.status} />
                {subscription.cancel_at_period_end && (
                  <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">Cancels at period end</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">{subscription.plan_name || '—'}</p>
              {subscription.mrr > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">${(subscription.mrr / 100).toFixed(0)}/mo MRR</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Period End</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {subscription.current_period_end ? (
                  <span title={new Date(subscription.current_period_end).toISOString()}>
                    {formatDate(subscription.current_period_end)}
                  </span>
                ) : '—'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white" title={new Date(subscription.created_at).toISOString()}>
                {relativeTime(subscription.created_at)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stripe Subscription ID</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono text-xs">{subscription.stripe_subscription_id || '—'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Status Timeline</h3>
            <div className="space-y-3">
              {timelineEvents.map((evt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <evt.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{evt.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400" title={new Date(evt.date).toISOString()}>
                      {formatDate(evt.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Payment History</h3>
            {invoices.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No invoices found</p>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{formatDate(inv.created)}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{formatCurrency(inv.amount, inv.currency)}</td>
                        <td className="px-4 py-2">
                          <StatusBadge status={inv.status || 'unknown'} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          {inv.hosted_invoice_url && (
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="View invoice"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4 inline" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Admin Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCancelDialog(true)}
                disabled={subscription.status === 'canceled'}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40"
              >
                Cancel Subscription
              </button>
              <button
                onClick={() => setShowChangePlanDialog(true)}
                disabled={!subscription.stripe_subscription_id}
                className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/40"
              >
                Change Plan
              </button>
              <button
                onClick={() => setShowExtendTrialDialog(true)}
                disabled={!subscription.stripe_subscription_id}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40"
              >
                Extend Trial
              </button>
              <button
                onClick={() => setShowCreditDialog(true)}
                disabled={!subscription.stripe_subscription_id}
                className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40"
              >
                Apply Credit
              </button>
            </div>
          </div>
        </div>

        {showCancelDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={() => setShowCancelDialog(false)} role="dialog" aria-modal="true" aria-label="Cancel subscription">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancel Subscription</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Are you sure you want to cancel this subscription? This action cannot be undone.
              </p>
              <label className="flex items-center gap-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={cancelImmediate}
                  onChange={(e) => setCancelImmediate(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                Cancel immediately (instead of at period end)
              </label>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'cancel' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showChangePlanDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={() => setShowChangePlanDialog(false)} role="dialog" aria-modal="true" aria-label="Change plan">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Plan</h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Stripe Price ID</label>
              <input
                type="text"
                value={newPriceId}
                onChange={(e) => setNewPriceId(e.target.value)}
                placeholder="price_..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-1"
              />
              {!newPriceId && (
                <p className="text-xs text-red-500 mb-3">Price ID is required</p>
              )}
              <div className="flex gap-3 justify-end mt-4">
                <button
                  onClick={() => setShowChangePlanDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePlan}
                  disabled={actionLoading === 'changePlan' || !newPriceId}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'changePlan' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Change Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {showExtendTrialDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={() => setShowExtendTrialDialog(false)} role="dialog" aria-modal="true" aria-label="Extend trial">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Extend Trial</h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Trial End Date</label>
              <input
                type="date"
                value={trialEndDate}
                onChange={(e) => setTrialEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-1"
              />
              {!trialEndDate && (
                <p className="text-xs text-red-500 mb-3">Date is required</p>
              )}
              <div className="flex gap-3 justify-end mt-4">
                <button
                  onClick={() => setShowExtendTrialDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtendTrial}
                  disabled={actionLoading === 'extendTrial' || !trialEndDate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'extendTrial' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Extend Trial
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreditDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={() => setShowCreditDialog(false)} role="dialog" aria-modal="true" aria-label="Apply credit">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Apply Credit</h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (USD)</label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="10.00"
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-3"
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input
                type="text"
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
                placeholder="Courtesy credit"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-1"
              />
              {!creditAmount && (
                <p className="text-xs text-red-500 mb-3">Amount is required</p>
              )}
              <div className="flex gap-3 justify-end mt-4">
                <button
                  onClick={() => setShowCreditDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCredit}
                  disabled={actionLoading === 'credit' || !creditAmount}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'credit' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Apply Credit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
