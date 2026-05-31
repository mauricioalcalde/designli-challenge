import {
  StockSnapshotStorage,
  type StockSnapshot,
} from '../domain/stock-snapshot-storage.port';

const STOCKS_SNAPSHOT_KEY = 'stocks_snapshot';

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
}
