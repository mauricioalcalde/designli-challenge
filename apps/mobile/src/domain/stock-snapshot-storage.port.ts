import type { StockListing } from '@designli-challenge/shared';

export interface StockSnapshot {
  items: StockListing[];
  savedAt: string;
}

/**
 * Abstract port for last-successful stocks snapshot persistence.
 * Implemented in a later slice when stale fallback ships.
 */
export abstract class StockSnapshotStorage {
  abstract get(): StockSnapshot | null;
  abstract set(snapshot: StockSnapshot): void;
}
