'use client';

import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
        className
      )}
    />
  );
}

export function TreeSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 16}px` }}>
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className={`h-4 rounded ${i % 2 === 0 ? 'w-32' : 'w-24'}`} />
        </div>
      ))}
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {[...Array(12)].map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 rounded ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-3/4' : 'w-1/2'}`}
        />
      ))}
    </div>
  );
}
