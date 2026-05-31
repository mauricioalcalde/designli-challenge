import type { StockListing, StockChartPoint, ChartRange } from '@designli-challenge/shared';
import { create } from 'zustand';
import type { StockSnapshotStorage } from '../domain/stock-snapshot-storage.port';
import type { StocksRepository } from '../domain/stocks.repository.port';
import { StocksLoadError, StockChartError } from '../domain/stocks.errors';

export interface StocksState {
  // ---- list slice ----
  items: StockListing[];
  isLoading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  lastUpdatedAt: string | null;
  error: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;

  // ---- chart slice ----
  chartData: StockChartPoint[];
  chartSymbol: string | null;
  chartRange: ChartRange;
  chartIsLoading: boolean;
  chartError: string | null;
  loadChart: (symbol: string, range: ChartRange) => Promise<void>;
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

  return create<StocksState>()((set, get) => ({
    // ---- list slice ----
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

    // ---- chart slice ----
    chartData: [],
    chartSymbol: null,
    chartRange: '1W',
    chartIsLoading: false,
    chartError: null,

    loadChart: async (symbol: string, range: ChartRange) => {
      set({ chartSymbol: symbol, chartRange: range, chartIsLoading: true, chartError: null });

      try {
        const data = await stocksRepo.chart(symbol, range);

        // Discard stale responses: only apply if the store's current range
        // still matches the range this request was sent for.
        if (get().chartRange !== range || get().chartSymbol !== symbol) {
          return;
        }

        set({ chartData: data, chartIsLoading: false, chartError: null });
      } catch (error) {
        // Discard stale error responses too
        if (get().chartRange !== range || get().chartSymbol !== symbol) {
          return;
        }

        const chartError = StockChartError.fromUnknown(error);
        set({ chartData: [], chartIsLoading: false, chartError: chartError.message });
      }
    },
  }));
}
