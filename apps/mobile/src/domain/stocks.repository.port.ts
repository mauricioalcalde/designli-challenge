import type { StockListing } from '@designli-challenge/shared';

/**
 * Abstract port for authenticated stock-list retrieval.
 * Implemented by the data layer, consumed by the application store.
 */
export abstract class StocksRepository {
  abstract list(): Promise<StockListing[]>;
}
