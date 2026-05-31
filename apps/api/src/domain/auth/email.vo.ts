import { DomainError } from './domain-error';

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new DomainError('Invalid email format');
    }
    return new Email(email);
  }

  toString(): string {
    return this.value;
  }
}
