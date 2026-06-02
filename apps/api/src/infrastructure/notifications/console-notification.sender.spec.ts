import { describe, expect, it, vi } from 'vitest';
import { ConsoleNotificationSender } from './console-notification.sender';

describe('ConsoleNotificationSender', () => {
  it('returns sent when persisted tokens are available', async () => {
    const sender = new ConsoleNotificationSender();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await sender.send(
      1,
      {
        alertId: 7,
        userId: 1,
        symbol: 'AAPL',
        currentPrice: 185,
        threshold: 180,
        direction: 'above',
        message: 'AAPL moved',
      },
      ['token-a'],
    );

    expect(result).toEqual({ success: true, status: 'sent' });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('tokens=1'));

    logSpy.mockRestore();
  });

  it('returns skipped when persisted tokens are missing', async () => {
    const sender = new ConsoleNotificationSender();

    const result = await sender.send(
      1,
      {
        alertId: 7,
        userId: 1,
        symbol: 'AAPL',
        currentPrice: 185,
        threshold: 180,
        direction: 'above',
        message: 'AAPL moved',
      },
      [],
    );

    expect(result).toEqual({
      success: false,
      status: 'skipped',
      error: 'No persisted device tokens',
    });
  });
});
