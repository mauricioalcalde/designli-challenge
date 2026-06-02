import type { StockListing } from '@designli-challenge/shared';
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
      chart: jest.fn(),
    } as unknown as jest.Mocked<StocksRepository>;

    mockSnapshotStorage = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      appendHistory: jest.fn(),
      getHistory: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<StockSnapshotStorage>;

    useStocksStore = createStocksStore(mockStocksRepo, mockSnapshotStorage, now);
  });

  it('loads listings on first load success', async () => {
    mockStocksRepo.list.mockResolvedValue(listings);

    await useStocksStore.getState().loadInitial();

    expect(useStocksStore.getState().items).toEqual(listings);
    expect(useStocksStore.getState().isInitialLoading).toBe(false);
    expect(useStocksStore.getState().isStale).toBe(false);
    expect(useStocksStore.getState().lastUpdatedAt).toBe('2026-05-29T16:40:00.000Z');
    expect(useStocksStore.getState().error).toBeNull();
    expect(useStocksStore.getState().consecutiveRefreshFailures).toBe(0);
  });

  it('stores a retryable error when first load fails without usable data', async () => {
    mockStocksRepo.list.mockRejectedValue(new StocksLoadError('No internet connection'));

    await useStocksStore.getState().loadInitial();

    expect(useStocksStore.getState().items).toEqual([]);
    expect(useStocksStore.getState().isInitialLoading).toBe(false);
    expect(useStocksStore.getState().error).toBe('No internet connection');
    expect(useStocksStore.getState().lastUpdatedAt).toBeNull();
  });

  it('hydrates cached data and marks the result stale when background refresh fails', async () => {
    mockSnapshotStorage.get.mockReturnValue({
      items: listings,
      savedAt: '2026-05-28T10:00:00.000Z',
    });
    mockStocksRepo.list.mockRejectedValue(new StocksLoadError('No internet connection'));

    await useStocksStore.getState().loadInitial();

    expect(useStocksStore.getState().items).toEqual(listings);
    expect(useStocksStore.getState().isInitialLoading).toBe(false);
    expect(useStocksStore.getState().isBackgroundRefreshing).toBe(false);
    expect(useStocksStore.getState().isStale).toBe(true);
    expect(useStocksStore.getState().lastUpdatedAt).toBe('2026-05-28T10:00:00.000Z');
    expect(useStocksStore.getState().error).toBeNull();
    expect(useStocksStore.getState().consecutiveRefreshFailures).toBe(1);
    expect(useStocksStore.getState().staleReason).toBe('network');
  });

  it('keeps visible items during background refresh failures', async () => {
    mockStocksRepo.list.mockResolvedValueOnce(listings);
    await useStocksStore.getState().loadInitial();

    const visibleItems = useStocksStore.getState().items;
    mockSnapshotStorage.get.mockReturnValue({
      items: [
        {
          symbol: 'TSLA',
          name: 'Tesla',
          currentPrice: 181.1,
          changePercent: -1.12,
        },
      ],
      savedAt: '2026-05-28T22:30:00.000Z',
    });
    mockStocksRepo.list.mockRejectedValueOnce(new StocksLoadError('Request timed out'));

    await useStocksStore.getState().refreshInBackground();

    expect(useStocksStore.getState().items).toEqual(visibleItems);
    expect(useStocksStore.getState().lastUpdatedAt).toBe('2026-05-29T16:40:00.000Z');
    expect(useStocksStore.getState().isStale).toBe(true);
    expect(useStocksStore.getState().consecutiveRefreshFailures).toBe(1);
    expect(useStocksStore.getState().error).toBeNull();
  });

  it('uses the manual refresh flag without turning on the initial loader', async () => {
    mockStocksRepo.list.mockResolvedValueOnce(listings);
    await useStocksStore.getState().loadInitial();

    let resolveRefresh!: (value: StockListing[]) => void;
    mockStocksRepo.list.mockReturnValueOnce(
      new Promise<StockListing[]>((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const refreshPromise = useStocksStore.getState().refreshManually();

    expect(useStocksStore.getState().isManualRefreshing).toBe(true);
    expect(useStocksStore.getState().isInitialLoading).toBe(false);
    expect(useStocksStore.getState().isBackgroundRefreshing).toBe(false);

    resolveRefresh(listings);
    await refreshPromise;

    expect(useStocksStore.getState().isManualRefreshing).toBe(false);
    expect(useStocksStore.getState().isStale).toBe(false);
  });

  it('does not stack a background refresh while a manual refresh is running', async () => {
    mockStocksRepo.list.mockResolvedValueOnce(listings);
    await useStocksStore.getState().loadInitial();

    let resolveRefresh!: (value: StockListing[]) => void;
    mockStocksRepo.list.mockReturnValueOnce(
      new Promise<StockListing[]>((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const manualPromise = useStocksStore.getState().refreshManually();
    await useStocksStore.getState().refreshInBackground();

    expect(mockStocksRepo.list).toHaveBeenCalledTimes(2);

    resolveRefresh(listings);
    await manualPromise;
  });

  it('classifies provider failures separately from offline failures', async () => {
    mockSnapshotStorage.get.mockReturnValue({
      items: listings,
      savedAt: '2026-05-28T10:00:00.000Z',
    });
    mockStocksRepo.list.mockRejectedValue(new StocksLoadError('403 forbidden from provider'));

    await useStocksStore.getState().loadInitial();

    expect(useStocksStore.getState().staleReason).toBe('provider');
    expect(useStocksStore.getState().staleMessage).toBe('Market data may be outdated.');
  });

  it('builds chart data from stored quote history', async () => {
    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-29T16:40:00.000Z').getTime());

    mockSnapshotStorage.getHistory.mockReturnValue([
      {
        symbol: 'AAPL',
        price: 210,
        timestamp: '2026-05-29T16:00:00.000Z',
      },
      {
        symbol: 'AAPL',
        price: 214.8,
        timestamp: '2026-05-29T16:35:00.000Z',
      },
    ]);

    await useStocksStore.getState().loadChart('AAPL', '1D');

    expect(useStocksStore.getState().chartData).toHaveLength(2);
    expect(useStocksStore.getState().chartData[1]?.close).toBe(214.8);
    expect(useStocksStore.getState().chartIsLoading).toBe(false);
    expect(useStocksStore.getState().chartError).toBeNull();

    dateNowSpy.mockRestore();
  });

  it('shows a chart empty-state error when no quote history exists yet', async () => {
    await useStocksStore.getState().loadChart('AAPL', '1D');

    expect(useStocksStore.getState().chartData).toEqual([]);
    expect(useStocksStore.getState().chartIsLoading).toBe(false);
    expect(useStocksStore.getState().chartError).toBe(
      'No price history available yet. Keep the app open to collect data.',
    );
  });
});
