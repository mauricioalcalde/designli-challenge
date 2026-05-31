import type { AxiosInstance } from 'axios';
import type { StockListing } from '@designli-challenge/shared';
import { StocksRepository } from '../domain/stocks.repository.port';
import { StocksLoadError } from '../domain/stocks.errors';

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
}
