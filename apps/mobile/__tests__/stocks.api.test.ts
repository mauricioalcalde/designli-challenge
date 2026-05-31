import type { AxiosInstance } from 'axios';
import type { StockListing, StockChartPoint, ChartRange } from '@designli-challenge/shared';
import { StocksApi } from '../src/data/stocks.api';
import { StocksLoadError, StockChartError } from '../src/domain/stocks.errors';

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

  // ---- chart ----

  const chartPoints: StockChartPoint[] = [
    {
      timestamp: '2026-05-29T10:00:00.000Z',
      open: 210.0,
      high: 213.5,
      low: 209.5,
      close: 212.45,
    },
    {
      timestamp: '2026-05-29T10:15:00.000Z',
      open: 212.45,
      high: 214.0,
      low: 211.8,
      close: 213.2,
    },
  ];

  it('gets StockChartPoint[] from /stocks/:symbol/chart?range=', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: chartPoints });

    await expect(stocksApi.chart('AAPL', '1W')).resolves.toEqual(chartPoints);
    expect(client.get).toHaveBeenCalledWith('/stocks/AAPL/chart', {
      params: { range: '1W' },
    });
  });

  it('wraps chart failures as StockChartError', async () => {
    (client.get as jest.Mock).mockRejectedValue(new Error('Server error: 500'));

    await expect(stocksApi.chart('MSFT', '1M')).rejects.toEqual(
      expect.objectContaining({
        message: 'Server error: 500',
        name: 'StockChartError',
      }),
    );
  });

  it('preserves an existing StockChartError', async () => {
    const error = new StockChartError('Symbol not found');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(stocksApi.chart('UNKNOWN', '1W')).rejects.toBe(error);
  });
});
