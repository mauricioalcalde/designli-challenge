import type { AuthResponse } from '@designli-challenge/shared';
import { createAuthStore } from '../src/application/auth.store';
import { MmkvTokenStorage } from '../src/data/token-storage.mmkv';
import type { AuthRepository } from '../src/domain/auth.repository.port';

describe('auth persistence integration', () => {
  const mmkvState = new Map<string, string>();

  const mmkv = {
    getString: jest.fn((key: string) => mmkvState.get(key)),
    set: jest.fn((key: string, value: string) => {
      mmkvState.set(key, value);
    }),
    remove: jest.fn((key: string) => {
      mmkvState.delete(key);
    }),
  };

  let authRepo: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    mmkvState.clear();
    jest.clearAllMocks();

    authRepo = {
      login: jest.fn(),
      register: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;
  });

  it('persists auth_token on login and bootstrap restores authentication on cold start', async () => {
    const tokenStorage = new MmkvTokenStorage(mmkv);
    const firstStore = createAuthStore(authRepo, tokenStorage);
    const secondStore = createAuthStore(authRepo, tokenStorage);
    const response: AuthResponse = {
      token: 'persisted-jwt',
      user: { id: 1, email: 'user@example.com' },
    };

    authRepo.login.mockResolvedValue(response);

    await firstStore.getState().login('user@example.com', 'securePass1');

    expect(mmkv.getString('auth_token')).toBe('persisted-jwt');
    expect(secondStore.getState().isAuthenticated).toBe(false);

    secondStore.getState().bootstrap();

    expect(secondStore.getState().isAuthenticated).toBe(true);
  });

  it('removes auth_token from MMKV on logout', async () => {
    const tokenStorage = new MmkvTokenStorage(mmkv);
    const store = createAuthStore(authRepo, tokenStorage);
    const response: AuthResponse = {
      token: 'persisted-jwt',
      user: { id: 1, email: 'user@example.com' },
    };

    authRepo.login.mockResolvedValue(response);

    await store.getState().login('user@example.com', 'securePass1');
    expect(mmkv.getString('auth_token')).toBe('persisted-jwt');

    store.getState().logout();

    expect(mmkv.getString('auth_token')).toBeUndefined();
    expect(store.getState().isAuthenticated).toBe(false);
  });
});
