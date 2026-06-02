import type { StockListing, StockChartPoint, ChartRange } from '@designli-challenge/shared';
import { create } from 'zustand';
import type { StockSnapshotStorage } from '../domain/stock-snapshot-storage.port';
import type { StocksRepository } from '../domain/stocks.repository.port';
import { StocksLoadError } from '../domain/stocks.errors';

export interface StocksState {
  // ---- list slice ----
  items: StockListing[];
  isInitialLoading: boolean;
  isBackgroundRefreshing: boolean;
  isManualRefreshing: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  lastUpdatedAt: string | null;
  error: string | null;
  consecutiveRefreshFailures: number;
  staleReason?: 'network' | 'provider' | 'unknown' | null;
  staleMessage?: string | null;
  loadInitial: () => Promise<void>;
  refreshInBackground: () => Promise<void>;
  refreshManually: () => Promise<void>;
  load: () => Promise<void>;
  refresh: () => Promise<void>;

  // ---- chart slice ----
  chartData: StockChartPoint[];
  chartSymbol: string | null;
  chartRange: ChartRange;
  chartIsLoading: boolean;
  chartError: string | null;
  chartCache: Record<string, StockChartPoint[]>;
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
  const classifyFailure = (
    message: string,
  ): { reason: 'network' | 'provider' | 'unknown'; staleMessage: string } => {
    const normalized = message.toLowerCase();

    if (
      normalized.includes('offline') ||
      normalized.includes('network') ||
      normalized.includes('timeout') ||
      normalized.includes('timed out') ||
      normalized.includes('failed to fetch') ||
      normalized.includes('no response') ||
      normalized.includes('internet')
    ) {
      return {
        reason: 'network',
        staleMessage: "You're offline. Showing cached data.",
      };
    }

    if (
      normalized.includes("don't have access") ||
      normalized.includes('403') ||
      normalized.includes('forbidden') ||
      normalized.includes('provider') ||
      normalized.includes('server')
    ) {
      return {
        reason: 'provider',
        staleMessage: 'Market data may be outdated.',
      };
    }

    return {
      reason: 'unknown',
      staleMessage: 'Market data may be outdated.',
    };
  };

  const syncSuccessState = (items: StockListing[]) => {
    const savedAt = now();
    snapshotStorage.set({ items, savedAt });
    snapshotStorage.appendHistory(items, savedAt);

    return {
      items,
      isInitialLoading: false,
      isBackgroundRefreshing: false,
      isManualRefreshing: false,
      isLoading: false,
      isRefreshing: false,
      isStale: false,
      lastUpdatedAt: savedAt,
      error: null,
      consecutiveRefreshFailures: 0,
      staleReason: null,
      staleMessage: null,
    };
  };

  const buildFailureState = (error: unknown, current: StocksState) => {
    const loadError = StocksLoadError.fromUnknown(error);
    const snapshot = snapshotStorage.get();
    const fallbackItems = current.items.length > 0 ? current.items : (snapshot?.items ?? []);
    const hasFallbackItems = fallbackItems.length > 0;

    if (hasFallbackItems) {
      const failure = classifyFailure(loadError.message);

      return {
        items: fallbackItems,
        isInitialLoading: false,
        isBackgroundRefreshing: false,
        isManualRefreshing: false,
        isLoading: false,
        isRefreshing: false,
        isStale: true,
        lastUpdatedAt: current.lastUpdatedAt ?? snapshot?.savedAt ?? null,
        error: null,
        consecutiveRefreshFailures: current.consecutiveRefreshFailures + 1,
        staleReason: failure.reason,
        staleMessage: failure.staleMessage,
      };
    }

    return {
      items: [],
      isInitialLoading: false,
      isBackgroundRefreshing: false,
      isManualRefreshing: false,
      isLoading: false,
      isRefreshing: false,
      isStale: false,
      lastUpdatedAt: null,
      error: loadError.message,
      consecutiveRefreshFailures: 0,
      staleReason: null,
      staleMessage: null,
    };
  };

  const hasPendingListRequest = (state: StocksState) =>
    state.isInitialLoading || state.isBackgroundRefreshing || state.isManualRefreshing;

  const hydrateFromSnapshot = (setState: (partial: Partial<StocksState>) => void): boolean => {
    const snapshot = snapshotStorage.get();
    if (!snapshot) return false;

    setState({
      items: snapshot.items,
      isInitialLoading: false,
      isBackgroundRefreshing: false,
      isManualRefreshing: false,
      isLoading: false,
      isRefreshing: false,
      isStale: false,
      lastUpdatedAt: snapshot.savedAt,
      error: null,
      consecutiveRefreshFailures: 0,
      staleReason: null,
      staleMessage: null,
    });

    return true;
  };

  const rangeToWindowMs = (range: ChartRange): number => {
    switch (range) {
      case '1D':
        return 24 * 60 * 60 * 1000;
      case '1W':
        return 7 * 24 * 60 * 60 * 1000;
      case '1M':
        return 30 * 24 * 60 * 60 * 1000;
      case '3M':
        return 90 * 24 * 60 * 60 * 1000;
      case '1Y':
        return 365 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  };

  const buildChartFromHistory = (symbol: string, range: ChartRange): StockChartPoint[] => {
    const history = snapshotStorage.getHistory(symbol);
    if (history.length === 0) return [];

    const cutoff = Date.now() - rangeToWindowMs(range);
    const filtered = history.filter((point) => new Date(point.timestamp).getTime() >= cutoff);
    const source = filtered;

    return source.map((point, index, arr) => {
      const prev = arr[index - 1]?.price ?? point.price;
      const open = prev;
      const close = point.price;
      const high = Math.max(open, close);
      const low = Math.min(open, close);

      return {
        timestamp: point.timestamp,
        open,
        high,
        low,
        close,
      };
    });
  };

  return create<StocksState>()((set, get) => ({
    // ---- list slice ----
    items: [],
    isInitialLoading: false,
    isBackgroundRefreshing: false,
    isManualRefreshing: false,
    isLoading: false,
    isRefreshing: false,
    isStale: false,
    lastUpdatedAt: null,
    error: null,
    consecutiveRefreshFailures: 0,
    staleReason: null,
    staleMessage: null,

    loadInitial: async () => {
      const current = get();
      if (hasPendingListRequest(current)) return;

      if (current.items.length === 0 && hydrateFromSnapshot((partial) => set(partial))) {
        await get().refreshInBackground();
        return;
      }

      set({
        isInitialLoading: true,
        isBackgroundRefreshing: false,
        isManualRefreshing: false,
        isLoading: true,
        isRefreshing: false,
        error: null,
        staleReason: null,
        staleMessage: null,
      });

      try {
        const items = await stocksRepo.list();
        set(syncSuccessState(items));
      } catch (error) {
        set(buildFailureState(error, get()));
      }
    },

    refreshInBackground: async () => {
      const current = get();
      if (hasPendingListRequest(current)) return;

      set({
        isBackgroundRefreshing: true,
        isManualRefreshing: false,
        isRefreshing: true,
        error: null,
      });

      try {
        const items = await stocksRepo.list();
        set(syncSuccessState(items));
      } catch (error) {
        set(buildFailureState(error, get()));
      }
    },

    refreshManually: async () => {
      const current = get();
      if (hasPendingListRequest(current)) return;

      set({
        isBackgroundRefreshing: false,
        isManualRefreshing: true,
        isRefreshing: true,
        error: null,
      });

      try {
        const items = await stocksRepo.list();
        set(syncSuccessState(items));
      } catch (error) {
        set(buildFailureState(error, get()));
      }
    },

    load: async () => {
      await get().loadInitial();
    },

    refresh: async () => {
      await get().refreshManually();
    },

    // ---- chart slice ----
    chartData: [],
    chartSymbol: null,
    chartRange: '1D',
    chartIsLoading: false,
    chartError: null,
    chartCache: {},

    loadChart: async (symbol: string, range: ChartRange) => {
      set({
        chartSymbol: symbol,
        chartRange: range,
        chartData: [],
        chartIsLoading: true,
        chartError: null,
      });
      const cacheKey = `${symbol}:${range}`;

      // Always build chart from local quote snapshots (single source of truth)
      // Finnhub free tier returns 403 for /stock/candle, so we rely on quote snapshots
      // which are the same data source as Market Overview (ensures consistency)
      const derivedChart = buildChartFromHistory(symbol, range);

      if (derivedChart.length === 0) {
        // No history yet - show empty state
        set({
          chartData: [],
          chartIsLoading: false,
          chartError: 'No price history available yet. Keep the app open to collect data.',
        });
        return;
      }

      // Discard stale responses: only apply if the store's current range
      // still matches the range this request was sent for.
      if (get().chartRange !== range || get().chartSymbol !== symbol) {
        return;
      }

      set((state) => ({
        chartData: derivedChart,
        chartIsLoading: false,
        chartError: null,
        chartCache: {
          ...state.chartCache,
          [cacheKey]: derivedChart,
        },
      }));
    },
  }));
}
