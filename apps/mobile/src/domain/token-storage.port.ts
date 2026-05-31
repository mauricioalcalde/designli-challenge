/**
 * Abstract port for synchronous token persistence.
 * MMKV provides synchronous reads — no flash on cold start.
 */
export abstract class TokenStorage {
  abstract get(): string | null;
  abstract set(token: string): void;
  abstract clear(): void;
}
