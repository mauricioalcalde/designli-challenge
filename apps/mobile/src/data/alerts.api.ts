import type { AxiosInstance } from 'axios';
import type { AlertResponse, CreateAlertDTO } from '@designli-challenge/shared';
import { AlertsRepository } from '../domain/alerts.repository.port';
import { AlertsCreateError, AlertsDeleteError, AlertsLoadError } from '../domain/alerts.errors';

/**
 * HTTP implementation of AlertsRepository.
 * Uses the pre-configured authenticated Axios client.
 */
export class AlertsApi extends AlertsRepository {
  constructor(private readonly client: AxiosInstance) {
    super();
  }

  async list(): Promise<AlertResponse[]> {
    try {
      const { data } = await this.client.get<AlertResponse[]>('/alerts');
      return data;
    } catch (error) {
      throw AlertsLoadError.fromUnknown(error);
    }
  }

  async create(dto: CreateAlertDTO, idempotencyKey: string): Promise<AlertResponse> {
    try {
      const { data } = await this.client.post<AlertResponse>('/alerts', dto, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      return data;
    } catch (error) {
      throw AlertsCreateError.fromUnknown(error);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.client.delete(`/alerts/${id}`);
    } catch (error) {
      throw AlertsDeleteError.fromUnknown(error);
    }
  }
}
