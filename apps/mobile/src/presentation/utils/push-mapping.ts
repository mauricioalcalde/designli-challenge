import type { AddNotificationInput } from '../../application/inbox.store';

/**
 * Maps an incoming push notification payload to the inbox store's input shape.
 * Handles missing title/body/data fields gracefully with safe defaults.
 *
 * This is a PURE function — deterministic, no side effects, trivially testable.
 */
export function mapPushToInboxInput(payload: {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}): AddNotificationInput {
  return {
    title: payload.title ?? 'Notification',
    body: payload.body ?? '',
    type: 'alert',
    symbol: payload.data?.symbol as string | undefined,
    alertId: payload.data?.alertId ? Number(payload.data.alertId) : undefined,
  };
}
