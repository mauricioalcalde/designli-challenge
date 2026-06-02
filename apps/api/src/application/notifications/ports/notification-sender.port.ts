import { AlertNotificationPayload, NotificationResult } from '@designli-challenge/shared';

export abstract class INotificationSender {
  abstract send(
    userId: number,
    payload: AlertNotificationPayload,
    deviceTokens: string[],
  ): Promise<NotificationResult>;
}
