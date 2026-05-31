import { Injectable } from '@nestjs/common';
import { StockListing, StockChartPoint } from '@designli-challenge/shared';
import { IStockProvider } from '../../application/stocks/ports/stock-provider.port';
import { StockProviderError } from '../../application/stocks/stock-provider.error';
import { TRACKED_SYMBOLS } from './mock-stock.provider';

interface FinnhubQuote {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
}

interface FinnhubCandle {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  t: number[];
  s: string;
}

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function rangeToParams(
  range: string,
): { resolution: string; from: number; to: number } {
  const now = Math.floor(Date.now() / 1000);
  switch (range.toUpperCase()) {
    case '1D':
      return { resolution: '5', from: now - 86400, to: now };
    case '1W':
      return { resolution: '30', from: now - 604800, to: now };
    case '1M':
      return { resolution: 'D', from: now - 2592000, to: now };
    case '3M':
      return { resolution: 'D', from: now - 7776000, to: now };
    case '1Y':
      return { resolution: 'W', from: now - 31536000, to: now };
    default:
      return { resolution: '30', from: now - 604800, to: now };
  }
}

@Injectable()
export class FinnhubStockProvider extends IStockProvider {
  constructor(private readonly apiKey: string) {
    super();
  }

  async list(): Promise<StockListing[]> {
    const results: StockListing[] = [];

    for (const tracked of TRACKED_SYMBOLS) {
      try {
        const res = await fetch(
          `${FINNHUB_BASE}/quote?symbol=${tracked.symbol}&token=${this.apiKey}`,
        );

        if (!res.ok) {
          throw new Error(`Finnhub returned ${res.status}: ${res.statusText}`);
        }

        const quote: FinnhubQuote = await res.json();

        results.push({
          symbol: tracked.symbol,
          name: tracked.name,
          currentPrice: quote.c,
          changePercent: Math.round(quote.dp * 100) / 100,
        });
      } catch (error) {
        throw new StockProviderError(
          `Failed to fetch quote for ${tracked.symbol}: ${(error as Error).message}`,
          'finnhub',
        );
      }
    }

    return results;
  }

  async chart(symbol: string, range: string): Promise<StockChartPoint[]> {
    const { resolution, from, to } = rangeToParams(range);

    try {
      const url = `${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Finnhub returned ${res.status}: ${res.statusText}`);
      }

      const candle: FinnhubCandle = await res.json();

      if (candle.s === 'no_data') {
        return [];
      }

      return candle.t.map((timestamp, i) => ({
        timestamp: new Date(timestamp * 1000).toISOString(),
        open: candle.o[i],
        high: candle.h[i],
        low: candle.l[i],
        close: candle.c[i],
      }));
    } catch (error) {
      throw new StockProviderError(
        `Failed to fetch chart for ${symbol}: ${(error as Error).message}`,
        'finnhub',
      );
    }
  }
}
