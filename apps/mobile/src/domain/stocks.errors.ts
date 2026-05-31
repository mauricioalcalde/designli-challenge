export class StocksLoadError extends Error {
  name = 'StocksLoadError';

  constructor(message?: string) {
    super(message ?? 'Unable to load stocks right now');
  }

  static fromUnknown(error: unknown): StocksLoadError {
    if (error instanceof StocksLoadError) {
      return error;
    }

    if (error instanceof Error && error.message) {
      return new StocksLoadError(error.message);
    }

    return new StocksLoadError();
  }
}
