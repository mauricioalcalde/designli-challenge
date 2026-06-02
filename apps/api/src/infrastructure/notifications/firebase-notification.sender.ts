import { Injectable } from '@nestjs/common';
import { INotificationSender } from '../../application/notifications/ports/notification-sender.port';
import { AlertNotificationPayload, NotificationResult } from '@designli-challenge/shared';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseNotificationSender implements INotificationSender {
  private messaging: admin.messaging.Messaging | null = null;

  private getMessaging(): admin.messaging.Messaging | null {
    if (this.messaging) return this.messaging;

    try {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
      this.messaging = admin.messaging();
    } catch {
      console.warn(
        '[FirebaseNotificationSender] firebase-admin not configured. Notifications will not be sent.',
      );
      this.messaging = null;
    }

    return this.messaging;
  }

  async send(
    _userId: number,
    payload: AlertNotificationPayload,
    deviceTokens: string[],
  ): Promise<NotificationResult> {
    if (deviceTokens.length === 0) {
      return { success: false, status: 'skipped', error: 'No persisted device tokens' };
    }

    const messaging = this.getMessaging();
    if (!messaging) {
      return { success: false, status: 'skipped', error: 'Firebase not configured' };
    }

    try {
      const response = await messaging.sendEachForMulticast({
        tokens: deviceTokens,
        notification: {
          title: `Stock Alert: ${payload.symbol}`,
          body: payload.message,
        },
        data: {
          alertId: String(payload.alertId),
          symbol: payload.symbol,
          type: 'alert-triggered',
          direction: payload.direction,
          threshold: String(payload.threshold),
          currentPrice: String(payload.currentPrice),
        },
      });

      if (response.successCount > 0) {
        return { success: true, status: 'sent' };
      }

      return {
        success: false,
        status: 'failed',
        error: response.responses[0]?.error?.message ?? 'FCM send failed',
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'FCM send failed',
      };
    }
  }
}
