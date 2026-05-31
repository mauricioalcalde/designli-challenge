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

  async send(_userId: number, payload: AlertNotificationPayload): Promise<NotificationResult> {
    const messaging = this.getMessaging();
    if (!messaging) {
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      await messaging.send({
        token: 'placeholder', // Token lookup done by scheduler before calling
        notification: {
          title: `Stock Alert: ${payload.symbol}`,
          body: payload.message,
        },
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'FCM send failed',
      };
    }
  }
}
