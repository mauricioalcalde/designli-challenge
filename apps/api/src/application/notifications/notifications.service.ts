import { Injectable, Inject } from '@nestjs/common';
import { DeviceTokenDTO } from '@designli-challenge/shared';
import { IDeviceTokenRepository } from './ports/device-token-repository.port';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(IDeviceTokenRepository)
    private readonly deviceTokenRepository: IDeviceTokenRepository,
  ) {}

  async registerToken(userId: number, dto: DeviceTokenDTO): Promise<void> {
    await this.deviceTokenRepository.upsert(userId, dto.token, dto.platform);
  }
}
