import type { StockListing, StockChartPoint, ChartRange } from '@designli-challenge/shared';
import { StocksRepository } from '../domain/stocks.repository.port';
import { StocksLoadError, StockChartError } from '../domain/stocks.errors';
import { apiFetch } from './apiFetch';
import type { TokenStorage } from '../domain/token-storage.port';

/**
 * HTTP implementation of StocksRepository.
 * Uses native fetch through apiFetch wrapper.
 */
export class StocksApi extends StocksRepository {
  constructor(private readonly tokenStorage: TokenStorage) {
    super();
  }

  async list(): Promise<StockListing[]> {
    try {
      const token = this.tokenStorage.get();
      return await apiFetch<StockListing[]>('/stocks', {
        method: 'GET',
        token,
      });
    } catch (error) {
      throw StocksLoadError.fromUnknown(error);
    }
  }

  async chart(symbol: string, range: ChartRange): Promise<StockChartPoint[]> {
    try {
      const token = this.tokenStorage.get();
      return await apiFetch<StockChartPoint[]>(
        `/stocks/${encodeURIComponent(symbol)}/chart?range=${range}`,
        {
          method: 'GET',
          token,
        },
      );
    } catch (error) {
      throw StockChartError.fromUnknown(error);
    }
  }
}
