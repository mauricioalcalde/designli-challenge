import { Injectable } from '@nestjs/common';
import { StockListing, StockChartPoint } from '@designli-challenge/shared';
import { IStockProvider } from '../../application/stocks/ports/stock-provider.port';

export const TRACKED_SYMBOLS: StockListing[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 178.32, changePercent: 1.24 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 141.76, changePercent: -0.53 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', currentPrice: 332.58, changePercent: 0.87 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', currentPrice: 146.73, changePercent: 2.31 },
  { symbol: 'TSLA', name: 'Tesla Inc.', currentPrice: 248.42, changePercent: -1.89 },
];

@Injectable()
export class MockStockProvider extends IStockProvider {
  async list(): Promise<StockListing[]> {
    return [...TRACKED_SYMBOLS];
  }

  async chart(symbol: string, _range: string): Promise<StockChartPoint[]> {
    const found = TRACKED_SYMBOLS.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!found) {
      return [];
    }

    const basePrice = found.currentPrice * 0.95;
    const now = Date.now();
    const points: StockChartPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const timestamp = new Date(now - (6 - i) * 86400000).toISOString();
      const open = basePrice + Math.random() * 10;
      const close = basePrice + Math.random() * 10;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;

      points.push({
        timestamp,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
      });
    }

    return points;
  }
}
