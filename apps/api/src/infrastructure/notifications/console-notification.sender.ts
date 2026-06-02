import { Injectable } from '@nestjs/common';
import { INotificationSender } from '../../application/notifications/ports/notification-sender.port';
import { AlertNotificationPayload, NotificationResult } from '@designli-challenge/shared';

@Injectable()
export class ConsoleNotificationSender implements INotificationSender {
  async send(
    userId: number,
    payload: AlertNotificationPayload,
    deviceTokens: string[],
  ): Promise<NotificationResult> {
    if (deviceTokens.length === 0) {
      return { success: false, status: 'skipped', error: 'No persisted device tokens' };
    }

    console.log(
      `[NOTIFICATION] userId=${userId} | alertId=${payload.alertId} | ${payload.symbol} ` +
        `${payload.direction} $${payload.threshold} at $${payload.currentPrice} | tokens=${deviceTokens.length}`,
    );
    return { success: true, status: 'sent' };
  }
}
