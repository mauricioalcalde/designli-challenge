export class AlertDirection {
  private static readonly ALLOWED = ['above', 'below'] as const;

  private constructor(public readonly value: 'above' | 'below') {}

  static create(direction: string): AlertDirection {
    if (!AlertDirection.ALLOWED.includes(direction as 'above' | 'below')) {
      throw new Error(`Invalid alert direction: ${direction}`);
    }
    return new AlertDirection(direction as 'above' | 'below');
  }

  toString(): string {
    return this.value;
  }
}
