export interface DeviceTokenDTO {
  token: string;
  platform: string;
}

export interface AlertNotificationPayload {
  alertId: number;
  userId: number;
  symbol: string;
  currentPrice: number;
  threshold: number;
  direction: string;
  message: string;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
}
