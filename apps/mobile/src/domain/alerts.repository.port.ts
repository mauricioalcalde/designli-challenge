import type { AlertResponse, CreateAlertDTO } from '@designli-challenge/shared';

/**
 * Abstract port for authenticated alerts operations.
 * Implemented by the data layer, consumed by the application store.
 */
export abstract class AlertsRepository {
  abstract list(): Promise<AlertResponse[]>;
  abstract create(dto: CreateAlertDTO, idempotencyKey: string): Promise<AlertResponse>;
  abstract delete(id: number): Promise<void>;
}
