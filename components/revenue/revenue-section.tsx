'use client';

import { cn } from '@/lib/utils';
import { RevenueCard } from './revenue-card';
import type { RevenueData } from '@/lib/revenue-client';

interface RevenueSectionProps {
  title: string;
  subtitle?: string;
  data: RevenueData;
  className?: string;
}

export function RevenueSection({ title, subtitle, data, className }: RevenueSectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
        {data.error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{data.error}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <RevenueCard period="today" amount={data.today} loading={data.loading} />
        <RevenueCard period="mtd" amount={data.mtd} loading={data.loading} />
        <RevenueCard period="ytd" amount={data.ytd} loading={data.loading} />
      </div>
    </div>
  );
}
