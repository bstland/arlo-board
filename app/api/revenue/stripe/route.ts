import { NextRequest, NextResponse } from 'next/server';

const ACCOUNT_KEYS: Record<string, string | undefined> = {
  landmodo: process.env.STRIPE_LANDMODO_KEY,
  investorninjas: process.env.STRIPE_INVESTORNINJAS_KEY,
  st: process.env.STRIPE_ST_KEY,
};

async function fetchStripeRevenue(apiKey: string, startTime: number): Promise<number> {
  let total = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const url = new URL('https://api.stripe.com/v1/balance_transactions');
    url.searchParams.append('created[gte]', startTime.toString());
    url.searchParams.append('limit', '100');
    if (startingAfter) url.searchParams.append('starting_after', startingAfter);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch from Stripe');
    }

    const data = await response.json();
    data.data.forEach((bt: any) => {
      if (bt.amount > 0 && bt.type !== 'payout' && bt.type !== 'transfer') {
        total += bt.amount;
      }
    });

    hasMore = data.has_more;
    if (hasMore && data.data.length > 0) {
      startingAfter = data.data[data.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return total / 100;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account } = body as { account: string };

    if (!account || !ACCOUNT_KEYS[account]) {
      return NextResponse.json(
        { error: `Invalid account: ${account}` },
        { status: 400 }
      );
    }

    const apiKey = ACCOUNT_KEYS[account];
    if (!apiKey) {
      return NextResponse.json(
        { error: `Missing API key for account: ${account}` },
        { status: 500 }
      );
    }

    // Compute EST-aware time boundaries
    const now = new Date();
    const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const todayStart = Math.floor(
      new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate()).getTime() / 1000
    );
    const mtdStart = Math.floor(
      new Date(estNow.getFullYear(), estNow.getMonth(), 1).getTime() / 1000
    );
    const ytdStart = Math.floor(
      new Date(estNow.getFullYear(), 0, 1).getTime() / 1000
    );

    const [today, mtd, ytd] = await Promise.all([
      fetchStripeRevenue(apiKey, todayStart),
      fetchStripeRevenue(apiKey, mtdStart),
      fetchStripeRevenue(apiKey, ytdStart),
    ]);

    return NextResponse.json({ today, mtd, ytd });
  } catch (err: any) {
    console.error('Stripe revenue error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
