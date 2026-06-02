import { describe, expect, it, vi } from 'vitest';
import { FirebaseNotificationSender } from './firebase-notification.sender';

describe('FirebaseNotificationSender', () => {
  it('sends only to persisted tokens and reports sent', async () => {
    const sender = new FirebaseNotificationSender();
    const sendEachForMulticast = vi.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [],
    });

    vi.spyOn(sender as never, 'getMessaging').mockReturnValue({
      sendEachForMulticast,
    } as never);

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
      ['token-a', 'token-b'],
    );

    expect(result).toEqual({ success: true, status: 'sent' });
    expect(sendEachForMulticast).toHaveBeenCalledWith({
      tokens: ['token-a', 'token-b'],
      notification: {
        title: 'Stock Alert: AAPL',
        body: 'AAPL moved',
      },
    });
  });

  it('reports skipped honestly when firebase credentials are unavailable', async () => {
    const sender = new FirebaseNotificationSender();

    vi.spyOn(sender as never, 'getMessaging').mockReturnValue(null as never);

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

    expect(result).toEqual({ success: false, status: 'skipped', error: 'Firebase not configured' });
  });

  it('reports failed when firebase rejects every persisted token', async () => {
    const sender = new FirebaseNotificationSender();
    const sendEachForMulticast = vi.fn().mockResolvedValue({
      successCount: 0,
      failureCount: 1,
      responses: [{ error: { message: 'registration-token-not-registered' } }],
    });

    vi.spyOn(sender as never, 'getMessaging').mockReturnValue({
      sendEachForMulticast,
    } as never);

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

    expect(result).toEqual({
      success: false,
      status: 'failed',
      error: 'registration-token-not-registered',
    });
  });
});
