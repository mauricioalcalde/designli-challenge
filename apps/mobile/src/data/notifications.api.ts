import type { AxiosInstance } from 'axios';
import type { DeviceTokenDTO } from '@designli-challenge/shared';
import { NotificationsRepository } from '../domain/notifications.repository.port';
import { NotificationsRegistrationError } from '../domain/notifications.errors';

/**
 * HTTP implementation of notification token registration.
 */
export class NotificationsApi extends NotificationsRepository {
  constructor(private readonly client: AxiosInstance) {
    super();
  }

  async registerDeviceToken(dto: DeviceTokenDTO): Promise<void> {
    try {
      await this.client.post('/devices/token', dto);
    } catch (error) {
      throw NotificationsRegistrationError.fromUnknown(error);
    }
  }
}
