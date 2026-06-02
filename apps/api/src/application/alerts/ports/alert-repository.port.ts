import { Alert } from '../../../domain/alerts/alert.entity';

export abstract class IAlertRepository {
  abstract save(alert: Alert): Promise<Alert>;
  abstract findByClientRequestId(userId: number, clientRequestId: string): Promise<Alert | null>;
  abstract findAllByUser(userId: number): Promise<Alert[]>;
  abstract findAllActive(): Promise<Alert[]>;
  abstract findById(id: number): Promise<Alert | null>;
  abstract delete(id: number): Promise<void>;
  abstract updateLastTriggered(id: number, lastTriggeredAt: Date): Promise<void>;
  abstract updateLastNotifiedDirection(id: number, direction: string | null): Promise<void>;
}
