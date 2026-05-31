import { StockListing, StockChartPoint } from '@designli-challenge/shared';

export abstract class IStockProvider {
  abstract list(): Promise<StockListing[]>;
  abstract chart(symbol: string, range: string): Promise<StockChartPoint[]>;
}
