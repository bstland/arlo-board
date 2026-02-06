'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/revenue-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CalendarDays, CalendarRange, type LucideIcon } from 'lucide-react';

const PERIOD_ICONS: Record<string, LucideIcon> = {
  today: Calendar,
  mtd: CalendarDays,
  ytd: CalendarRange,
};

const PERIOD_LABELS: Record<string, string> = {
  today: 'Today',
  mtd: 'Month to Date',
  ytd: 'Year to Date',
};

interface RevenueCardProps {
  period: 'today' | 'mtd' | 'ytd';
  amount: number;
  loading?: boolean;
  variant?: 'default' | 'grand';
}

export function RevenueCard({ period, amount, loading, variant = 'default' }: RevenueCardProps) {
  const Icon = PERIOD_ICONS[period];
  const label = PERIOD_LABELS[period];
  const isGrand = variant === 'grand';

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl p-4 border',
          isGrand
            ? 'bg-gray-800/50 dark:bg-[#181825]/50 border-gray-700 dark:border-[#313244]'
            : 'bg-white dark:bg-[#1e1e2e] border-gray-200 dark:border-[#313244]',
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-20 h-3 rounded" />
        </div>
        <Skeleton className={cn('rounded', isGrand ? 'w-32 h-8' : 'w-28 h-7')} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 border transition-all duration-150',
        isGrand
          ? 'bg-gray-800/50 dark:bg-[#181825]/50 border-gray-700 dark:border-[#313244] hover:bg-gray-800/70 dark:hover:bg-[#181825]/70'
          : 'bg-white dark:bg-[#1e1e2e] border-gray-200 dark:border-[#313244] hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-sm',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon
          size={14}
          className={cn(
            isGrand ? 'text-violet-300' : 'text-gray-400 dark:text-gray-500',
          )}
        />
        <span
          className={cn(
            'text-xs font-medium uppercase tracking-wider',
            isGrand ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400',
          )}
        >
          {label}
        </span>
      </div>
      <p
        className={cn(
          'font-bold tabular-nums',
          isGrand ? 'text-2xl text-white' : 'text-xl text-gray-900 dark:text-gray-100',
        )}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
