import type { StockListing } from '@designli-challenge/shared';

export interface StockSnapshot {
  items: StockListing[];
  savedAt: string;
}

export interface StockQuoteHistoryPoint {
  symbol: string;
  price: number;
  timestamp: string;
}

/**
 * Abstract port for last-successful stocks snapshot persistence.
 * Implemented in a later slice when stale fallback ships.
 */
export abstract class StockSnapshotStorage {
  abstract get(): StockSnapshot | null;
  abstract set(snapshot: StockSnapshot): void;
  abstract appendHistory(items: StockListing[], savedAt: string): void;
  abstract getHistory(symbol: string): StockQuoteHistoryPoint[];
}
