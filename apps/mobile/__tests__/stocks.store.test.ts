import type { StockListing, StockChartPoint, ChartRange } from '@designli-challenge/shared';
import { createStocksStore } from '../src/application/stocks.store';
import type { StockSnapshotStorage } from '../src/domain/stock-snapshot-storage.port';
import type { StocksRepository } from '../src/domain/stocks.repository.port';
import { StocksLoadError } from '../src/domain/stocks.errors';

describe('stocks.store', () => {
  let mockStocksRepo: jest.Mocked<StocksRepository>;
  let mockSnapshotStorage: jest.Mocked<StockSnapshotStorage>;
  let useStocksStore: ReturnType<typeof createStocksStore>;
  const now = jest.fn(() => '2026-05-29T16:40:00.000Z');

  const listings: StockListing[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currentPrice: 212.45,
      changePercent: 1.23,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft',
      currentPrice: 498.12,
      changePercent: -0.47,
    },
  ];

  beforeEach(() => {
    mockStocksRepo = {
      list: jest.fn(),
    } as unknown as jest.Mocked<StocksRepository>;

    mockSnapshotStorage = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
    } as unknown as jest.Mocked<StockSnapshotStorage>;

    useStocksStore = createStocksStore(mockStocksRepo, mockSnapshotStorage, now);
  });

  it('loads listings into state on success', async () => {
    mockStocksRepo.list.mockResolvedValue(listings);

    await useStocksStore.getState().load();

    expect(useStocksStore.getState().items).toEqual(listings);
    expect(useStocksStore.getState().isLoading).toBe(false);
    expect(useStocksStore.getState().isStale).toBe(false);
    expect(useStocksStore.getState().lastUpdatedAt).toBe('2026-05-29T16:40:00.000Z');
    expect(useStocksStore.getState().error).toBeNull();
    expect(mockSnapshotStorage.set).toHaveBeenCalledWith({
      items: listings,
      savedAt: '2026-05-29T16:40:00.000Z',
    });
  });

  it('supports explicit empty state responses', async () => {
    mockStocksRepo.list.mockResolvedValue([]);

    await useStocksStore.getState().load();

    expect(useStocksStore.getState().items).toEqual([]);
    expect(useStocksStore.getState().error).toBeNull();
    expect(useStocksStore.getState().lastUpdatedAt).toBe('2026-05-29T16:40:00.000Z');
  });

  it('stores a retryable error when loading fails without data', async () => {
    mockStocksRepo.list.mockRejectedValue(new StocksLoadError('No internet connection'));

    await useStocksStore.getState().load();

    expect(useStocksStore.getState().items).toEqual([]);
    expect(useStocksStore.getState().isLoading).toBe(false);
    expect(useStocksStore.getState().error).toBe('No internet connection');
  });

  it('falls back to the last snapshot when loading fails after a saved success', async () => {
    mockSnapshotStorage.get.mockReturnValue({
      items: listings,
      savedAt: '2026-05-28T10:00:00.000Z',
    });
    mockStocksRepo.list.mockRejectedValue(new StocksLoadError('No internet connection'));

    await useStocksStore.getState().load();

    expect(useStocksStore.getState().items).toEqual(listings);
    expect(useStocksStore.getState().isStale).toBe(true);
    expect(useStocksStore.getState().lastUpdatedAt).toBe('2026-05-28T10:00:00.000Z');
    expect(useStocksStore.getState().error).toBeNull();
  });

  it('transitions isRefreshing and replaces items after refresh success', async () => {
    mockStocksRepo.list.mockResolvedValueOnce(listings);
    await useStocksStore.getState().load();

    const refreshedListings: StockListing[] = [
      {
        symbol: 'NVDA',
        name: 'NVIDIA',
        currentPrice: 124.11,
        changePercent: 2.9,
      },
    ];

    let resolveRefresh!: (value: StockListing[]) => void;
    const refreshPromise = new Promise<StockListing[]>((resolve) => {
      resolveRefresh = resolve;
    });
    mockStocksRepo.list.mockReturnValueOnce(refreshPromise);

    const action = useStocksStore.getState().refresh();
    expect(useStocksStore.getState().isRefreshing).toBe(true);

    resolveRefresh(refreshedListings);
    await action;

    expect(useStocksStore.getState().isRefreshing).toBe(false);
    expect(useStocksStore.getState().items).toEqual(refreshedListings);
    expect(useStocksStore.getState().isStale).toBe(false);
    expect(useStocksStore.getState().error).toBeNull();
  });

  it('falls back to the last snapshot when refresh fails', async () => {
    mockStocksRepo.list.mockResolvedValueOnce(listings);
    await useStocksStore.getState().load();

    const staleListings: StockListing[] = [
      {
        symbol: 'TSLA',
        name: 'Tesla',
        currentPrice: 181.1,
        changePercent: -1.12,
      },
    ];

    mockSnapshotStorage.get.mockReturnValue({
      items: staleListings,
      savedAt: '2026-05-28T22:30:00.000Z',
    });
    mockStocksRepo.list.mockRejectedValueOnce(new StocksLoadError('Request timed out'));

    await useStocksStore.getState().refresh();

    expect(useStocksStore.getState().isRefreshing).toBe(false);
    expect(useStocksStore.getState().items).toEqual(staleListings);
    expect(useStocksStore.getState().isStale).toBe(true);
    expect(useStocksStore.getState().lastUpdatedAt).toBe('2026-05-28T22:30:00.000Z');
    expect(useStocksStore.getState().error).toBeNull();
  });

  // ---- chart slice ----

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
    {
      timestamp: '2026-05-29T10:30:00.000Z',
      open: 213.2,
      high: 215.0,
      low: 212.5,
      close: 214.8,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockStocksRepo = {
      list: jest.fn(),
      chart: jest.fn(),
    } as unknown as jest.Mocked<StocksRepository>;

    mockSnapshotStorage = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
    } as unknown as jest.Mocked<StockSnapshotStorage>;

    useStocksStore = createStocksStore(mockStocksRepo, mockSnapshotStorage, now);
  });

  it('loadChart populates chartData and resets loading on success', async () => {
    mockStocksRepo.chart.mockResolvedValue(chartPoints);

    await useStocksStore.getState().loadChart('AAPL', '1W');

    expect(useStocksStore.getState().chartData).toEqual(chartPoints);
    expect(useStocksStore.getState().chartSymbol).toBe('AAPL');
    expect(useStocksStore.getState().chartRange).toBe('1W');
    expect(useStocksStore.getState().chartIsLoading).toBe(false);
    expect(useStocksStore.getState().chartError).toBeNull();
  });

  it('loadChart sets chartError on failure and keeps chartData empty', async () => {
    mockStocksRepo.chart.mockRejectedValue(new Error('Network error'));

    await useStocksStore.getState().loadChart('MSFT', '1M');

    expect(useStocksStore.getState().chartIsLoading).toBe(false);
    expect(useStocksStore.getState().chartError).toBe('Network error');
    expect(useStocksStore.getState().chartData).toEqual([]);
    expect(useStocksStore.getState().chartSymbol).toBe('MSFT');
  });

  it('loadChart discards stale responses when a newer request finishes first', async () => {
    let resolve1W!: (value: StockChartPoint[]) => void;
    let resolve1M!: (value: StockChartPoint[]) => void;

    const promise1W = new Promise<StockChartPoint[]>((resolve) => {
      resolve1W = resolve;
    });
    const promise1M = new Promise<StockChartPoint[]>((resolve) => {
      resolve1M = resolve;
    });

    mockStocksRepo.chart.mockReturnValueOnce(promise1W).mockReturnValueOnce(promise1M);

    // Fire 1W request (in-flight)
    const action1W = useStocksStore.getState().loadChart('AAPL', '1W');

    // Fire 1M request before 1W resolves — should supersede
    const action1M = useStocksStore.getState().loadChart('AAPL', '1M');

    // 1M resolves first with its data
    const chartPoints1M: StockChartPoint[] = [
      {
        timestamp: '2026-05-01T10:00:00.000Z',
        open: 200.0,
        high: 202.0,
        low: 199.0,
        close: 201.5,
      },
    ];
    resolve1M(chartPoints1M);
    await action1M;

    expect(useStocksStore.getState().chartRange).toBe('1M');
    expect(useStocksStore.getState().chartData).toEqual(chartPoints1M);

    // Now 1W resolves — should be discarded because range no longer matches
    const chartPoints1W: StockChartPoint[] = [
      {
        timestamp: '2026-05-29T10:00:00.000Z',
        open: 210.0,
        high: 213.5,
        low: 209.5,
        close: 212.45,
      },
    ];
    resolve1W(chartPoints1W);
    await action1W;

    // State must still reflect the 1M data, not the stale 1W
    expect(useStocksStore.getState().chartRange).toBe('1M');
    expect(useStocksStore.getState().chartData).toEqual(chartPoints1M);
  });

  it('loadChart sets chartIsLoading to true while in-flight', () => {
    let resolveChart!: (value: StockChartPoint[]) => void;
    const chartPromise = new Promise<StockChartPoint[]>((resolve) => {
      resolveChart = resolve;
    });
    mockStocksRepo.chart.mockReturnValueOnce(chartPromise);

    // Fire but don't await — check mid-flight state
    useStocksStore.getState().loadChart('AAPL', '1W');

    expect(useStocksStore.getState().chartIsLoading).toBe(true);

    resolveChart(chartPoints);
  });

  // Restore original (non-chart) beforeEach for the existing list tests above
  // that rely on the mock shape without chart.  Since we redefined beforeEach
  // for the chart section we must ensure existing tests still pass — they get
  // their own state via the factory call in each test, so they are fine.
});
