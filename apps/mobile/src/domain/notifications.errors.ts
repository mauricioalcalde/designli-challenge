class NotificationsError extends Error {
  static getMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}

export class NotificationsPermissionError extends NotificationsError {
  name = 'NotificationsPermissionError';

  constructor(message?: string) {
    super(message ?? 'Unable to update notification permission right now');
  }

  static fromUnknown(error: unknown): NotificationsPermissionError {
    if (error instanceof NotificationsPermissionError) {
      return error;
    }

    return new NotificationsPermissionError(
      NotificationsError.getMessage(error, 'Unable to update notification permission right now'),
    );
  }
}

export class NotificationsTokenError extends NotificationsError {
  name = 'NotificationsTokenError';

  constructor(message?: string) {
    super(message ?? 'Unable to get a device token right now');
  }

  static fromUnknown(error: unknown): NotificationsTokenError {
    if (error instanceof NotificationsTokenError) {
      return error;
    }

    return new NotificationsTokenError(
      NotificationsError.getMessage(error, 'Unable to get a device token right now'),
    );
  }
}

export class NotificationsRegistrationError extends NotificationsError {
  name = 'NotificationsRegistrationError';

  constructor(message?: string) {
    super(message ?? 'Unable to register this device right now');
  }

  static fromUnknown(error: unknown): NotificationsRegistrationError {
    if (error instanceof NotificationsRegistrationError) {
      return error;
    }

    return new NotificationsRegistrationError(
      NotificationsError.getMessage(error, 'Unable to register this device right now'),
    );
  }
}
