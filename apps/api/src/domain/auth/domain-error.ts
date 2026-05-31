export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class EmailAlreadyInUseError extends DomainError {
  constructor(email: string) {
    super(`User with email "${email}" already exists`);
    this.name = 'EmailAlreadyInUseError';
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}
