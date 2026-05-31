import type { StockListing, StockChartPoint, ChartRange } from '@designli-challenge/shared';

/**
 * Abstract port for authenticated stock-list retrieval and chart data.
 * Implemented by the data layer, consumed by the application store.
 */
export abstract class StocksRepository {
  abstract list(): Promise<StockListing[]>;
  abstract chart(symbol: string, range: ChartRange): Promise<StockChartPoint[]>;
}
