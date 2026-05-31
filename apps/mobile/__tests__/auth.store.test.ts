import { createAuthStore } from '../src/application/auth.store';
import type { AuthRepository } from '../src/domain/auth.repository.port';
import type { TokenStorage } from '../src/domain/token-storage.port';
import type { AuthResponse } from '@designli-challenge/shared';

describe('auth.store', () => {
  let mockAuthRepo: jest.Mocked<AuthRepository>;
  let mockTokenStorage: jest.Mocked<TokenStorage>;
  let useAuthStore: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    mockAuthRepo = {
      login: jest.fn(),
      register: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    mockTokenStorage = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<TokenStorage>;

    useAuthStore = createAuthStore(mockAuthRepo, mockTokenStorage);
  });

  // --- R3.1 / R3.2: bootstrap ---

  describe('bootstrap', () => {
    it('sets isAuthenticated to true when token exists in storage', () => {
      mockTokenStorage.get.mockReturnValue('existing-jwt-token');

      useAuthStore.getState().bootstrap();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('sets isAuthenticated to false when no token is stored', () => {
      mockTokenStorage.get.mockReturnValue(null);

      useAuthStore.getState().bootstrap();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  // --- R3.3: login success ---

  describe('login — success', () => {
    const mockAuthResponse: AuthResponse = {
      token: 'fresh-jwt-abc',
      user: { id: 1, email: 'test@example.com' },
    };

    it('persists token and sets isAuthenticated after successful login', async () => {
      mockAuthRepo.login.mockResolvedValue(mockAuthResponse);

      await useAuthStore.getState().login('test@example.com', 'securePass1');

      expect(mockAuthRepo.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'securePass1',
      });
      expect(mockTokenStorage.set).toHaveBeenCalledWith('fresh-jwt-abc');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('transitions isLoading from true → false during successful login', async () => {
      let resolveLogin!: (value: AuthResponse) => void;
      const promise = new Promise<AuthResponse>((resolve) => {
        resolveLogin = resolve;
      });
      mockAuthRepo.login.mockReturnValue(promise);

      const loginCall = useAuthStore.getState().login('user@test.com', 'pass');
      expect(useAuthStore.getState().isLoading).toBe(true);

      resolveLogin(mockAuthResponse);
      await loginCall;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  // --- R3.4: login failure ---

  describe('login — failure', () => {
    it('sets error and keeps isAuthenticated false on auth failure', async () => {
      mockAuthRepo.login.mockRejectedValue(new Error('Invalid credentials'));

      await useAuthStore.getState().login('bad@test.com', 'wrong');

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
    });

    it('does not persist any token on failure', async () => {
      mockAuthRepo.login.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().login('test@example.com', 'any');

      expect(mockTokenStorage.set).not.toHaveBeenCalled();
    });
  });

  // --- register: success ---

  describe('register — success', () => {
    const mockAuthResponse: AuthResponse = {
      token: 'register-jwt-xyz',
      user: { id: 2, email: 'new@example.com' },
    };

    it('persists token and sets isAuthenticated after successful register', async () => {
      mockAuthRepo.register.mockResolvedValue(mockAuthResponse);

      await useAuthStore.getState().register('new@example.com', 'securePass1');

      expect(mockAuthRepo.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'securePass1',
      });
      expect(mockTokenStorage.set).toHaveBeenCalledWith('register-jwt-xyz');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('transitions isLoading from true → false during successful register', async () => {
      let resolveRegister!: (value: AuthResponse) => void;
      const promise = new Promise<AuthResponse>((resolve) => {
        resolveRegister = resolve;
      });
      mockAuthRepo.register.mockReturnValue(promise);

      const registerCall = useAuthStore.getState().register('new@test.com', 'pass');
      expect(useAuthStore.getState().isLoading).toBe(true);

      resolveRegister(mockAuthResponse);
      await registerCall;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  // --- register: failure ---

  describe('register — failure', () => {
    it('sets error and keeps isAuthenticated false on register failure', async () => {
      mockAuthRepo.register.mockRejectedValue(new Error('Email already taken'));

      await useAuthStore.getState().register('taken@test.com', 'pass123456');

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBe('Email already taken');
    });

    it('does not persist any token on register failure', async () => {
      mockAuthRepo.register.mockRejectedValue(new Error('Weak password'));

      await useAuthStore.getState().register('test@example.com', '12');

      expect(mockTokenStorage.set).not.toHaveBeenCalled();
    });
  });

  // --- R3.5: logout ---

  describe('logout', () => {
    it('clears token storage and resets auth state', () => {
      // Simulate authenticated state first
      mockTokenStorage.get.mockReturnValue('existing-token');
      useAuthStore.getState().bootstrap();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      useAuthStore.getState().logout();

      expect(mockTokenStorage.clear).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
