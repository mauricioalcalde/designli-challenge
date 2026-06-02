import { MmkvStockSnapshotStorage } from '../src/data/stock-snapshot.mmkv';

interface MockMmkvStorage {
  getString: jest.Mock<string | undefined, [string]>;
  set: jest.Mock<void, [string, string]>;
}

describe('MmkvStockSnapshotStorage', () => {
  const mockGetString = jest.fn();
  const mockSet = jest.fn();

  const mockMMKV: MockMmkvStorage = {
    getString: mockGetString,
    set: mockSet,
  };

  let storage: MmkvStockSnapshotStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new MmkvStockSnapshotStorage(mockMMKV);
  });

  it('stores snapshots under stocks_snapshot', () => {
    const snapshot = {
      items: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 212.45,
          changePercent: 1.23,
        },
      ],
      savedAt: '2026-05-29T16:40:00.000Z',
    };

    storage.set(snapshot);

    expect(mockSet).toHaveBeenCalledWith('stocks_snapshot', JSON.stringify(snapshot));
  });

  it('reads snapshots from MMKV', () => {
    mockGetString.mockReturnValue(
      JSON.stringify({
        items: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            currentPrice: 212.45,
            changePercent: 1.23,
          },
        ],
        savedAt: '2026-05-29T16:40:00.000Z',
      }),
    );

    expect(storage.get()).toEqual({
      items: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 212.45,
          changePercent: 1.23,
        },
      ],
      savedAt: '2026-05-29T16:40:00.000Z',
    });
    expect(mockGetString).toHaveBeenCalledWith('stocks_snapshot');
  });

  it('returns null for invalid snapshot JSON', () => {
    mockGetString.mockReturnValue('not-json');

    expect(storage.get()).toBeNull();
  });
});
