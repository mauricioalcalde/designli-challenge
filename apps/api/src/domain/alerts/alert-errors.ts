export class AlertAlreadyExistsError extends Error {
  constructor(clientRequestId: string) {
    super(`Alert with idempotency key "${clientRequestId}" already exists`);
    this.name = 'AlertAlreadyExistsError';
  }
}

export class AlertNotFoundError extends Error {
  constructor(id: number) {
    super(`Alert with id "${id}" was not found`);
    this.name = 'AlertNotFoundError';
  }
}
