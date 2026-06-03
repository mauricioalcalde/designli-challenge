import type { DeviceStatusResponse, DeviceTokenDTO } from '@designli-challenge/shared';
import { NotificationsRepository } from '../domain/notifications.repository.port';
import { NotificationsRegistrationError } from '../domain/notifications.errors';
import { apiFetch } from './apiFetch';
import type { TokenStorage } from '../domain/token-storage.port';

/**
 * HTTP implementation of notification token registration.
 * Uses native fetch through apiFetch wrapper.
 */
export class NotificationsApi extends NotificationsRepository {
  constructor(private readonly tokenStorage: TokenStorage) {
    super();
  }

  async registerDeviceToken(dto: DeviceTokenDTO): Promise<void> {
    try {
      const token = this.tokenStorage.get();
      await apiFetch('/devices/token', {
        method: 'POST',
        token,
        body: dto,
      });
    } catch (error) {
      throw NotificationsRegistrationError.fromUnknown(error);
    }
  }

  async getDeviceStatus(): Promise<DeviceStatusResponse> {
    try {
      const token = this.tokenStorage.get();
      return await apiFetch<DeviceStatusResponse>('/devices/status', {
        method: 'GET',
        token,
      });
    } catch (error) {
      throw NotificationsRegistrationError.fromUnknown(error);
    }
  }
}
