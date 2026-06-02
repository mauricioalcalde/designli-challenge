import { MmkvTokenStorage } from '../src/data/token-storage.mmkv';

interface MockMmkvStorage {
  getString: jest.Mock<string | undefined, [string]>;
  set: jest.Mock<void, [string, string]>;
  delete: jest.Mock<void, [string]>;
}

describe('MmkvTokenStorage', () => {
  const mockGetString = jest.fn();
  const mockSet = jest.fn();
  const mockDelete = jest.fn();

  const mockMMKV: MockMmkvStorage = {
    getString: mockGetString,
    set: mockSet,
    delete: mockDelete,
  };

  let storage: MmkvTokenStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new MmkvTokenStorage(mockMMKV);
  });

  it('set stores token under auth_token key', () => {
    storage.set('jwt-token-abc');
    expect(mockSet).toHaveBeenCalledWith('auth_token', 'jwt-token-abc');
  });

  it('get retrieves token from MMKV by auth_token key', () => {
    mockGetString.mockReturnValue('jwt-token-abc');
    expect(storage.get()).toBe('jwt-token-abc');
    expect(mockGetString).toHaveBeenCalledWith('auth_token');
  });

  it('get returns null when token is not stored', () => {
    mockGetString.mockReturnValue(undefined);
    expect(storage.get()).toBeNull();
    expect(mockGetString).toHaveBeenCalledWith('auth_token');
  });

  it('clear removes the auth_token key from MMKV', () => {
    storage.clear();
    expect(mockDelete).toHaveBeenCalledWith('auth_token');
  });

  it('clear does not throw when storage is already empty', () => {
    mockDelete.mockImplementation(() => {
      // MMKV delete is a no-op when key does not exist
    });
    expect(() => storage.clear()).not.toThrow();
    expect(mockDelete).toHaveBeenCalledWith('auth_token');
  });
});
