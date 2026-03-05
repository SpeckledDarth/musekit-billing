"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';

interface PlanTierData {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
  features: string[];
  popular?: boolean;
}

export interface PricingPageProps {
  plans: PlanTierData[];
  userId?: string | null;
  checkoutApiPath?: string;
  signupRedirect?: string;
  dashboardRedirect?: string;
  currentPlan?: string | null;
}

export function PricingPage({
  plans,
  userId,
  checkoutApiPath = '/api/checkout',
  signupRedirect = '/signup',
  dashboardRedirect = '/dashboard',
  currentPlan,
}: PricingPageProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PlanTierData) => {
    if (plan.monthlyPrice === 0) {
      if (!userId) {
        window.location.href = signupRedirect;
      } else {
        window.location.href = dashboardRedirect;
      }
      return;
    }

    if (!userId) {
      window.location.href = `${signupRedirect}?plan=${plan.id}`;
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const res = await fetch(checkoutApiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planId: plan.id,
          interval,
          successUrl: `${window.location.origin}${dashboardRedirect}?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPrice = (plan: PlanTierData) => {
    return interval === 'month' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getMonthlyEquivalent = (plan: PlanTierData) => {
    if (interval === 'year' && plan.annualPrice > 0) {
      return Math.round((plan.annualPrice / 12) * 100) / 100;
    }
    return plan.monthlyPrice;
  };

  const getSavings = (plan: PlanTierData) => {
    if (interval !== 'year' || plan.monthlyPrice === 0) return 0;
    return plan.monthlyPrice * 12 - plan.annualPrice;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include core features with no hidden fees.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            <button
              onClick={() => setInterval('month')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                interval === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                interval === 'year'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-600 dark:text-green-400 font-semibold">Save up to 17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const monthlyEquiv = getMonthlyEquivalent(plan);
            const savings = getSavings(plan);
            const isCurrent = currentPlan === plan.id;
            const isFreePlan = plan.monthlyPrice === 0;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.popular
                    ? 'border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/10'
                    : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-900`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${interval === 'year' && !isFreePlan ? monthlyEquiv : price}
                    </span>
                    {!isFreePlan && (
                      <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/mo</span>
                    )}
                  </div>
                  {interval === 'year' && !isFreePlan && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      ${price}/year
                      {savings > 0 && (
                        <span className="ml-1 text-green-600 dark:text-green-400 font-medium">
                          Save ${savings}
                        </span>
                      )}
                    </p>
                  )}
                  {isFreePlan && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Free forever</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent || loadingPlan === plan.id}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                  }`}
                >
                  {loadingPlan === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCurrent
                    ? 'Current Plan'
                    : isFreePlan
                      ? 'Get Started'
                      : 'Subscribe'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need a custom plan for your enterprise?{' '}
            <a href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
