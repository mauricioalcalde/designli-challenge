import type { AlertDirection, AlertResponse } from '@designli-challenge/shared';
import type { AlertItemStatus } from '../components/AlertItemCard';

export interface AlertsFeedback {
  tone: 'success' | 'info' | 'error';
  title: string;
  message: string;
}

export interface LocalAlertDraft {
  id: string;
  symbol: string;
  threshold: number;
  direction: AlertDirection;
  status: Extract<AlertItemStatus, 'pending' | 'failed'>;
  createdAt?: string;
}

export function formatAlertDirection(direction: AlertDirection): string {
  return direction === 'above' ? 'Above' : 'Below';
}

export function formatAlertPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatAlertSummary(
  symbol: string,
  direction: AlertDirection,
  threshold: number,
): string {
  return `Get notified when ${symbol} price goes ${direction} ${formatAlertPrice(threshold)}`;
}

export function getRemoteAlertStatus(
  item: AlertResponse,
): Extract<AlertItemStatus, 'active' | 'triggered'> {
  return !item.active || item.lastTriggeredAt ? 'triggered' : 'active';
}
