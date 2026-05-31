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

export interface StockProviderConfig {
  provider: 'mock' | 'finnhub';
  finnhubApiKey?: string;
}
