import type { DeviceTokenDTO } from '@designli-challenge/shared';

/**
 * Abstract port for authenticated notification token registration.
 */
export abstract class NotificationsRepository {
  abstract registerDeviceToken(dto: DeviceTokenDTO): Promise<void>;
}
