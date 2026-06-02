export interface DeviceTokenDTO {
  token: string;
  platform: string;
}

export interface DeviceStatusResponse {
  registered: boolean;
  platform: 'ios' | 'android' | null;
  lastRegisteredAt: string | null;
  tokenPreview: string | null;
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
  status: 'sent' | 'skipped' | 'failed';
  error?: string;
}
