export type AlertDirection = 'above' | 'below';

export type AlertStatus = 'active' | 'triggered';

export interface CreateAlertDTO {
  symbol: string;
  threshold: number;
  direction: AlertDirection;
}

export interface AlertResponse {
  id: number;
  userId: number;
  symbol: string;
  threshold: number;
  direction: AlertDirection;
  active: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
}
