import type { AlertResponse, CreateAlertDTO } from '@designli-challenge/shared';
import { AlertsRepository } from '../domain/alerts.repository.port';
import { AlertsCreateError, AlertsDeleteError, AlertsLoadError } from '../domain/alerts.errors';
import { apiFetch } from './apiFetch';
import type { TokenStorage } from '../domain/token-storage.port';

/**
 * HTTP implementation of AlertsRepository.
 * Uses native fetch through apiFetch wrapper.
 */
export class AlertsApi extends AlertsRepository {
  constructor(private readonly tokenStorage: TokenStorage) {
    super();
  }

  async list(): Promise<AlertResponse[]> {
    try {
      const token = this.tokenStorage.get();
      return await apiFetch<AlertResponse[]>('/alerts', {
        method: 'GET',
        token,
      });
    } catch (error) {
      throw AlertsLoadError.fromUnknown(error);
    }
  }

  async create(dto: CreateAlertDTO, idempotencyKey: string): Promise<AlertResponse> {
    try {
      const token = this.tokenStorage.get();
      return await apiFetch<AlertResponse>('/alerts', {
        method: 'POST',
        token,
        body: dto,
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
    } catch (error) {
      throw AlertsCreateError.fromUnknown(error);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const token = this.tokenStorage.get();
      await apiFetch(`/alerts/${id}`, {
        method: 'DELETE',
        token,
      });
    } catch (error) {
      throw AlertsDeleteError.fromUnknown(error);
    }
  }
}
