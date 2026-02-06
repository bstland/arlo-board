export interface RevenueData {
  today: number;
  mtd: number;
  ytd: number;
  loading: boolean;
  error?: string;
}

export async function fetchAccountRevenue(account: string): Promise<RevenueData> {
  try {
    const response = await fetch('/api/revenue/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account }),
    });

    if (!response.ok) {
      const err = await response.json();
      return {
        today: 0,
        mtd: 0,
        ytd: 0,
        loading: false,
        error: err.error || `Failed to fetch ${account}`,
      };
    }

    const data = await response.json();
    return {
      today: data.today,
      mtd: data.mtd,
      ytd: data.ytd,
      loading: false,
    };
  } catch (err: any) {
    return {
      today: 0,
      mtd: 0,
      ytd: 0,
      loading: false,
      error: err.message || 'Network error',
    };
  }
}

export const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format;
