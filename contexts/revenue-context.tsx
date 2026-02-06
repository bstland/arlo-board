'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { fetchAccountRevenue, type RevenueData } from '@/lib/revenue-client';

const ACCOUNTS = ['landmodo', 'investorninjas', 'st'] as const;
type AccountName = (typeof ACCOUNTS)[number];

interface RevenueState {
  accounts: Record<AccountName, RevenueData>;
  lastUpdated: Date | null;
  isSyncing: boolean;
  fetchAll: () => Promise<void>;
}

const defaultData: RevenueData = { today: 0, mtd: 0, ytd: 0, loading: true };

const RevenueContext = createContext<RevenueState>({
  accounts: {
    landmodo: defaultData,
    investorninjas: defaultData,
    st: defaultData,
  },
  lastUpdated: null,
  isSyncing: false,
  fetchAll: async () => {},
});

export function RevenueProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Record<AccountName, RevenueData>>({
    landmodo: { ...defaultData },
    investorninjas: { ...defaultData },
    st: { ...defaultData },
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    setIsSyncing(true);
    try {
      const results = await Promise.all(
        ACCOUNTS.map(async (name) => {
          const data = await fetchAccountRevenue(name);
          return [name, data] as [AccountName, RevenueData];
        })
      );

      const updated: Record<AccountName, RevenueData> = {
        landmodo: defaultData,
        investorninjas: defaultData,
        st: defaultData,
      };
      for (const [name, data] of results) {
        updated[name] = data;
      }

      setAccounts(updated);
      setLastUpdated(new Date());
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial fetch + 60s refresh
  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  return (
    <RevenueContext.Provider value={{ accounts, lastUpdated, isSyncing, fetchAll }}>
      {children}
    </RevenueContext.Provider>
  );
}

export function useRevenue() {
  return useContext(RevenueContext);
}
