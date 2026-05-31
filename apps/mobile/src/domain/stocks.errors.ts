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

export class StockChartError extends Error {
  name = 'StockChartError';

  constructor(message?: string) {
    super(message ?? 'Unable to load chart data');
  }

  static fromUnknown(error: unknown): StockChartError {
    if (error instanceof StockChartError) {
      return error;
    }

    if (error instanceof Error && error.message) {
      return new StockChartError(error.message);
    }

    return new StockChartError();
  }
}
