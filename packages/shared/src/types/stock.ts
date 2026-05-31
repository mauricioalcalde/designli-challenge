export interface StockListing {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
}

export interface StockChartPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y';

export interface StockProviderConfig {
  provider: 'mock' | 'finnhub';
  finnhubApiKey?: string;
}
