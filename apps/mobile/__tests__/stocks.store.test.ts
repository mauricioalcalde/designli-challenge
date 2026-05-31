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
});
