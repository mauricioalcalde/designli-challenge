import type { StockListing } from '@designli-challenge/shared';
import { create } from 'zustand';
import type { StockSnapshotStorage } from '../domain/stock-snapshot-storage.port';
import type { StocksRepository } from '../domain/stocks.repository.port';
import { StocksLoadError } from '../domain/stocks.errors';

export interface StocksState {
  items: StockListing[];
  isLoading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  lastUpdatedAt: string | null;
  error: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Zustand stocks store factory.
 * Keeps list/loading/error transitions testable outside React.
 */
export function createStocksStore(
  stocksRepo: StocksRepository,
  snapshotStorage: StockSnapshotStorage,
  now: () => string = () => new Date().toISOString(),
) {
  const syncSuccessState = (items: StockListing[]) => {
    const savedAt = now();
    snapshotStorage.set({ items, savedAt });

    return {
      items,
      isStale: false,
      lastUpdatedAt: savedAt,
      error: null,
    };
  };

  const buildFailureState = (error: unknown) => {
    const loadError = StocksLoadError.fromUnknown(error);
    const snapshot = snapshotStorage.get();

    if (snapshot) {
      return {
        items: snapshot.items,
        isStale: true,
        lastUpdatedAt: snapshot.savedAt,
        error: null,
      };
    }

    return {
      items: [],
      isStale: false,
      lastUpdatedAt: null,
      error: loadError.message,
    };
  };

  return create<StocksState>()((set) => ({
    items: [],
    isLoading: false,
    isRefreshing: false,
    isStale: false,
    lastUpdatedAt: null,
    error: null,

    load: async () => {
      set({ isLoading: true, error: null });

      try {
        const items = await stocksRepo.list();
        set({ ...syncSuccessState(items), isLoading: false });
      } catch (error) {
        set({ ...buildFailureState(error), isLoading: false });
      }
    },

    refresh: async () => {
      set({ isRefreshing: true, error: null });

      try {
        const items = await stocksRepo.list();
        set({ ...syncSuccessState(items), isRefreshing: false });
      } catch (error) {
        set({ ...buildFailureState(error), isRefreshing: false });
      }
    },
  }));
}
