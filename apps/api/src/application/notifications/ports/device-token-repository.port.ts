import type { DeviceStatusResponse } from '@designli-challenge/shared';

export abstract class IDeviceTokenRepository {
  abstract upsert(userId: number, token: string, platform: string): Promise<void>;
  abstract findByUser(userId: number): Promise<string[]>;
  abstract getStatusByUser(userId: number): Promise<DeviceStatusResponse>;
}
