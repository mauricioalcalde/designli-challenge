export class Alert {
  constructor(
    public readonly id: number,
    public readonly clientRequestId: string,
    public readonly userId: number,
    public readonly symbol: string,
    public readonly threshold: number,
    public readonly direction: 'above' | 'below',
    public readonly active: boolean,
    public readonly lastTriggeredAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
