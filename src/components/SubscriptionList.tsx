"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Search,
  ChevronUp,
  ChevronDown,
  Download,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react';

export interface SubscriptionListItem {
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
}

export interface SubscriptionListProps {
  apiBasePath?: string;
  onSelectSubscription?: (subscription: SubscriptionListItem) => void;
}

type SortField = 'user_name' | 'status' | 'stripe_price_id' | 'created_at' | 'current_period_end';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    trialing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    past_due: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    canceled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    incomplete: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.incomplete}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SubscriptionList({
  apiBasePath = '/api/admin',
  onSelectSubscription,
}: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkCancelDialog, setShowBulkCancelDialog] = useState(false);

  const perPage = 25;

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`${apiBasePath}/subscriptions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [apiBasePath, page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('page');
    const s = params.get('search');
    const st = params.get('status');
    const sb = params.get('sortBy');
    const so = params.get('sortOrder');
    if (p) setPage(parseInt(p));
    if (s) setSearch(s);
    if (st) setStatusFilter(st);
    if (sb) setSortBy(sb as SortField);
    if (so) setSortOrder(so as 'asc' | 'desc');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sortBy !== 'created_at') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [page, search, statusFilter, sortBy, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 text-indigo-500" />
      : <ChevronDown className="w-3 h-3 text-indigo-500" />;
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === subscriptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subscriptions.map((s) => s.id)));
    }
  };

  const handleBulkCancel = async () => {
    setBulkActionLoading(true);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`${apiBasePath}/subscriptions/${id}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ immediate: false }),
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setBulkActionLoading(false);
    setShowBulkCancelDialog(false);
    setSelectedIds(new Set());
    toast.success(`Canceled ${success} subscription(s)${failed > 0 ? `, ${failed} failed` : ''}`);
    fetchSubscriptions();
  };

  const exportCsv = () => {
    const headers = ['User', 'Email', 'Status', 'Price ID', 'Created', 'Period End'];
    const rows = subscriptions.map((s) => [
      s.user_name || '',
      s.user_email || '',
      s.status,
      s.stripe_price_id || '',
      s.created_at,
      s.current_period_end || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubscriptions();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Subscriptions {!loading && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({total})</span>}
        </h2>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <span className="text-sm text-indigo-700 dark:text-indigo-300">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Clear
            </button>
            <button
              onClick={() => setShowBulkCancelDialog(true)}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Cancel Selected
            </button>
          </div>
        </div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">No subscriptions found</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No subscriptions have been created yet'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === subscriptions.length && subscriptions.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer group"
                  onClick={() => handleSort('user_name')}
                >
                  <span className="inline-flex items-center gap-1">User <SortIcon field="user_name" /></span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer group"
                  onClick={() => handleSort('stripe_price_id')}
                >
                  <span className="inline-flex items-center gap-1">Plan <SortIcon field="stripe_price_id" /></span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer group"
                  onClick={() => handleSort('status')}
                >
                  <span className="inline-flex items-center gap-1">Status <SortIcon field="status" /></span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer group"
                  onClick={() => handleSort('created_at')}
                >
                  <span className="inline-flex items-center gap-1">Created <SortIcon field="created_at" /></span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer group"
                  onClick={() => handleSort('current_period_end')}
                >
                  <span className="inline-flex items-center gap-1">Period End <SortIcon field="current_period_end" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {subscriptions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => onSelectSubscription?.(sub)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(sub.id)}
                      onChange={() => toggleSelect(sub.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{sub.user_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{sub.user_email || ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                    {sub.stripe_price_id ? sub.stripe_price_id.slice(0, 20) + '...' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300" title={new Date(sub.created_at).toISOString()}>
                    {relativeTime(sub.created_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {formatDate(sub.current_period_end)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showBulkCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBulkCancelDialog(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancel {selectedIds.size} Subscription(s)</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to cancel {selectedIds.size} subscription(s)? They will be set to cancel at the end of their billing period.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkCancelDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Keep
              </button>
              <button
                onClick={handleBulkCancel}
                disabled={bulkActionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
