import { TokenStorage } from '../domain/token-storage.port';

const AUTH_TOKEN_KEY = 'auth_token';

interface MmkvStorageLike {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export class MmkvTokenStorage extends TokenStorage {
  constructor(private readonly storage: MmkvStorageLike) {
    super();
  }

  get(): string | null {
    return this.storage.getString(AUTH_TOKEN_KEY) ?? null;
  }

  set(token: string): void {
    this.storage.set(AUTH_TOKEN_KEY, token);
  }

  clear(): void {
    this.storage.delete(AUTH_TOKEN_KEY);
  }
}
