import { Injectable } from '@nestjs/common';
import { INotificationSender } from '../../application/notifications/ports/notification-sender.port';
import { AlertNotificationPayload, NotificationResult } from '@designli-challenge/shared';

@Injectable()
export class ConsoleNotificationSender implements INotificationSender {
  async send(userId: number, payload: AlertNotificationPayload): Promise<NotificationResult> {
    console.log(
      `[NOTIFICATION] userId=${userId} | alertId=${payload.alertId} | ${payload.symbol} ` +
        `${payload.direction} $${payload.threshold} at $${payload.currentPrice}`,
    );
    return { success: true };
  }
}
