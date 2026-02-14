'use client';

import { useRevenue } from '@/contexts/revenue-context';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/revenue-client';
import { RevenueCard } from './revenue-card';
import { RevenueSection } from './revenue-section';
import { RefreshCw, TrendingUp, Loader2 } from 'lucide-react';

export function RevenueDashboard() {
  const { accounts, lastUpdated, isSyncing, fetchAll } = useRevenue();

  const globalToday = accounts.landmodo.today + accounts.investorninjas.today + accounts.st.today;
  const globalMtd = accounts.landmodo.mtd + accounts.investorninjas.mtd + accounts.st.mtd;
  const globalYtd = accounts.landmodo.ytd + accounts.investorninjas.ytd + accounts.st.ytd;
  const anyLoading = accounts.landmodo.loading || accounts.investorninjas.loading || accounts.st.loading;

  // IP Consolidated = InvestorNinjas + ST
  const ipData = {
    today: accounts.investorninjas.today + accounts.st.today,
    mtd: accounts.investorninjas.mtd + accounts.st.mtd,
    ytd: accounts.investorninjas.ytd + accounts.st.ytd,
    loading: accounts.investorninjas.loading || accounts.st.loading,
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)] dark:bg-violet-500/20 flex items-center justify-center">
              <TrendingUp size={18} className="text-white dark:text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-[var(--color-text)]">Revenue</h1>
              <p className="text-xs text-gray-500 dark:text-gray-600">
                Stripe revenue across all accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-500">
              {isSyncing && (
                <Loader2 size={12} className="animate-spin text-[var(--color-primary)]" />
              )}
              {lastUpdated && (
                <span>
                  Updated{' '}
                  {lastUpdated.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: 'America/New_York',
                  })}
                </span>
              )}
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchAll}
              disabled={isSyncing}
              className={cn(
                'p-2 rounded-lg border transition-all duration-150',
                'border-gray-200 dark:border-[var(--color-border)]',
                'hover:bg-gray-100 dark:hover:bg-[var(--color-surface)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              title="Refresh revenue data"
            >
              <RefreshCw
                size={14}
                className={cn(
                  'text-gray-500 dark:text-gray-600',
                  isSyncing && 'animate-spin',
                )}
              />
            </button>
          </div>
        </div>

        {/* Grand Totals */}
        <div className="rounded-2xl bg-gray-900 dark:bg-[var(--color-surface)] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Global Totals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <RevenueCard period="today" amount={globalToday} loading={anyLoading} variant="grand" />
            <RevenueCard period="mtd" amount={globalMtd} loading={anyLoading} variant="grand" />
            <RevenueCard period="ytd" amount={globalYtd} loading={anyLoading} variant="grand" />
          </div>
        </div>

        {/* Landmodo */}
        <RevenueSection
          title="Landmodo"
          subtitle="Primary Operations"
          data={accounts.landmodo}
        />

        {/* IP Consolidated — right after Landmodo */}
        <div className="rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-700 dark:text-[var(--color-primary)]">
            IP Consolidated
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <RevenueCard period="today" amount={ipData.today} loading={ipData.loading} />
            <RevenueCard period="mtd" amount={ipData.mtd} loading={ipData.loading} />
            <RevenueCard period="ytd" amount={ipData.ytd} loading={ipData.loading} />
          </div>
        </div>

        {/* IP Group Breakdown */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-[var(--color-surface)]" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider">
              Intellectual Property Group
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-[var(--color-surface)]" />
          </div>

          <RevenueSection
            title="InvestorNinjas"
            data={accounts.investorninjas}
          />

          <RevenueSection
            title="ThriveCart Sales"
            data={accounts.st}
          />
        </div>
      </div>
    </div>
  );
}
