class AlertsError extends Error {
  static getMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}

export class AlertsLoadError extends AlertsError {
  name = 'AlertsLoadError';

  constructor(message?: string) {
    super(message ?? 'Unable to load alerts right now');
  }

  static fromUnknown(error: unknown): AlertsLoadError {
    if (error instanceof AlertsLoadError) {
      return error;
    }

    return new AlertsLoadError(AlertsError.getMessage(error, 'Unable to load alerts right now'));
  }
}

export class AlertsCreateError extends AlertsError {
  name = 'AlertsCreateError';

  constructor(message?: string) {
    super(message ?? 'Unable to create alert right now');
  }

  static fromUnknown(error: unknown): AlertsCreateError {
    if (error instanceof AlertsCreateError) {
      return error;
    }

    return new AlertsCreateError(AlertsError.getMessage(error, 'Unable to create alert right now'));
  }
}

export class AlertsDeleteError extends AlertsError {
  name = 'AlertsDeleteError';

  constructor(message?: string) {
    super(message ?? 'Unable to delete alert right now');
  }

  static fromUnknown(error: unknown): AlertsDeleteError {
    if (error instanceof AlertsDeleteError) {
      return error;
    }

    return new AlertsDeleteError(AlertsError.getMessage(error, 'Unable to delete alert right now'));
  }
}
