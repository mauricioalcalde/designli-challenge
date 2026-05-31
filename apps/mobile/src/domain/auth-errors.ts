export class NetworkError extends Error {
  name = 'NetworkError';

  constructor(message?: string) {
    super(message ?? 'Network request failed');
  }
}

export class AuthError extends Error {
  name = 'AuthError';

  constructor(message?: string) {
    super(message ?? 'Authentication failed');
  }
}

export class ServerError extends Error {
  name = 'ServerError';

  constructor(message?: string) {
    super(message ?? 'Server error occurred');
  }
}
