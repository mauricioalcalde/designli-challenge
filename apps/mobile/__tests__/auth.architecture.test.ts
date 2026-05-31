describe('auth architecture boundaries', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('creates the auth store with domain-only contracts even when data modules are blocked', async () => {
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(() => {
        try {
      jest.doMock('../src/data/auth.api', () => {
        throw new Error('application layer must not import auth.api');
      });

      jest.doMock('../src/data/token-storage.mmkv', () => {
        throw new Error('application layer must not import token-storage.mmkv');
      });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createAuthStore } = require('../src/application/auth.store') as typeof import('../src/application/auth.store');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { AuthRepository } = require('../src/domain/auth.repository.port') as typeof import('../src/domain/auth.repository.port');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TokenStorage } = require('../src/domain/token-storage.port') as typeof import('../src/domain/token-storage.port');

      class InMemoryAuthRepository extends AuthRepository {
        async login() {
          return {
            token: 'domain-only-jwt',
            user: { id: 1, email: 'user@example.com' },
          };
        }

        async register() {
          return {
            token: 'domain-only-jwt',
            user: { id: 1, email: 'user@example.com' },
          };
        }
      }

      class InMemoryTokenStorage extends TokenStorage {
        private token: string | null = null;

        get(): string | null {
          return this.token;
        }

        set(token: string): void {
          this.token = token;
        }

        clear(): void {
          this.token = null;
        }
      }

      const store = createAuthStore(
        new InMemoryAuthRepository(),
        new InMemoryTokenStorage(),
      );

          store
            .getState()
            .login('user@example.com', 'securePass1')
            .then(() => {
              expect(store.getState().isAuthenticated).toBe(true);
              expect(store.getState().error).toBeNull();
              resolve();
            })
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('honors the abstract TokenStorage contract at runtime through bootstrap and logout', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createAuthStore } = require('../src/application/auth.store') as typeof import('../src/application/auth.store');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TokenStorage } = require('../src/domain/token-storage.port') as typeof import('../src/domain/token-storage.port');

    class InMemoryTokenStorage extends TokenStorage {
      private token: string | null = null;

      get(): string | null {
        return this.token;
      }

      set(token: string): void {
        this.token = token;
      }

      clear(): void {
        this.token = null;
      }
    }

    const tokenStorage = new InMemoryTokenStorage();
    const authRepo = {
      login: jest.fn(),
      register: jest.fn(),
    };

    tokenStorage.set('persisted-jwt');

    const store = createAuthStore(authRepo, tokenStorage);

    store.getState().bootstrap();

    expect(tokenStorage.get()).toBe('persisted-jwt');
    expect(store.getState().isAuthenticated).toBe(true);

    store.getState().logout();

    expect(tokenStorage.get()).toBeNull();
    expect(store.getState().isAuthenticated).toBe(false);
  });
});
