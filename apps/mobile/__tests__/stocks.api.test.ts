import type { AxiosInstance } from 'axios';
import type { StockListing } from '@designli-challenge/shared';
import { StocksApi } from '../src/data/stocks.api';
import { StocksLoadError } from '../src/domain/stocks.errors';

describe('StocksApi', () => {
  let client: Pick<AxiosInstance, 'get'>;
  let stocksApi: StocksApi;

  beforeEach(() => {
    client = {
      get: jest.fn(),
    };

    stocksApi = new StocksApi(client as AxiosInstance);
  });

  it('gets StockListing[] from /stocks', async () => {
    const response: StockListing[] = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 212.45,
        changePercent: 1.23,
      },
    ];

    (client.get as jest.Mock).mockResolvedValue({ data: response });

    await expect(stocksApi.list()).resolves.toEqual(response);
    expect(client.get).toHaveBeenCalledWith('/stocks');
  });

  it('wraps client failures as StocksLoadError', async () => {
    (client.get as jest.Mock).mockRejectedValue(new Error('Server error: 500'));

    await expect(stocksApi.list()).rejects.toEqual(
      expect.objectContaining({
        message: 'Server error: 500',
        name: 'StocksLoadError',
      }),
    );
  });

  it('preserves an existing StocksLoadError', async () => {
    const error = new StocksLoadError('Unauthorized');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(stocksApi.list()).rejects.toBe(error);
  });
});
