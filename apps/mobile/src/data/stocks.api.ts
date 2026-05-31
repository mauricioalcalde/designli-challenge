import type { AxiosInstance } from 'axios';
import type { StockListing, StockChartPoint, ChartRange } from '@designli-challenge/shared';
import { StocksRepository } from '../domain/stocks.repository.port';
import { StocksLoadError, StockChartError } from '../domain/stocks.errors';

/**
 * HTTP implementation of StocksRepository.
 * Uses the pre-configured authenticated Axios client.
 */
export class StocksApi extends StocksRepository {
  constructor(private readonly client: AxiosInstance) {
    super();
  }

  async list(): Promise<StockListing[]> {
    try {
      const { data } = await this.client.get<StockListing[]>('/stocks');
      return data;
    } catch (error) {
      throw StocksLoadError.fromUnknown(error);
    }
  }

  async chart(symbol: string, range: ChartRange): Promise<StockChartPoint[]> {
    try {
      const { data } = await this.client.get<StockChartPoint[]>(
        `/stocks/${encodeURIComponent(symbol)}/chart`,
        { params: { range } },
      );
      return data;
    } catch (error) {
      throw StockChartError.fromUnknown(error);
    }
  }
}
