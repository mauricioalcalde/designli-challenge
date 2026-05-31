import { DomainError } from './domain-error';

export class Password {
  private constructor(private readonly value: string) {}

  static create(password: string): Password {
    if (!password || password.length < 6) {
      throw new DomainError('Password must be at least 6 characters long');
    }
    return new Password(password);
  }

  toString(): string {
    return this.value;
  }
}
