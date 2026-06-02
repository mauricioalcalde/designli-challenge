import {
  StockSnapshotStorage,
  type StockQuoteHistoryPoint,
  type StockSnapshot,
} from '../domain/stock-snapshot-storage.port';

const STOCKS_SNAPSHOT_KEY = 'stocks_snapshot';
const STOCKS_HISTORY_KEY = 'stocks_history';
const MAX_HISTORY_POINTS = 512;

interface MmkvStorageLike {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
}

export class MmkvStockSnapshotStorage extends StockSnapshotStorage {
  constructor(private readonly storage: MmkvStorageLike) {
    super();
  }

  get(): StockSnapshot | null {
    const rawSnapshot = this.storage.getString(STOCKS_SNAPSHOT_KEY);

    if (!rawSnapshot) {
      return null;
    }

    try {
      return JSON.parse(rawSnapshot) as StockSnapshot;
    } catch {
      return null;
    }
  }

  set(snapshot: StockSnapshot): void {
    this.storage.set(STOCKS_SNAPSHOT_KEY, JSON.stringify(snapshot));
  }

  appendHistory(items: StockSnapshot['items'], savedAt: string): void {
    const rawHistory = this.storage.getString(STOCKS_HISTORY_KEY);
    let history: Record<string, StockQuoteHistoryPoint[]> = {};

    if (rawHistory) {
      try {
        history = JSON.parse(rawHistory) as Record<string, StockQuoteHistoryPoint[]>;
      } catch {
        history = {};
      }
    }

    for (const item of items) {
      const key = item.symbol.toUpperCase();
      const points = history[key] ?? [];
      const lastPoint = points[points.length - 1];

      if (lastPoint && lastPoint.price === item.currentPrice) {
        continue;
      }

      const nextPoint: StockQuoteHistoryPoint = {
        symbol: key,
        price: item.currentPrice,
        timestamp: savedAt,
      };

      history[key] = [...points, nextPoint].slice(-MAX_HISTORY_POINTS);
    }

    this.storage.set(STOCKS_HISTORY_KEY, JSON.stringify(history));
  }

  getHistory(symbol: string): StockQuoteHistoryPoint[] {
    const rawHistory = this.storage.getString(STOCKS_HISTORY_KEY);
    if (!rawHistory) return [];

    try {
      const history = JSON.parse(rawHistory) as Record<string, StockQuoteHistoryPoint[]>;
      return history[symbol.toUpperCase()] ?? [];
    } catch {
      return [];
    }
  }
}
