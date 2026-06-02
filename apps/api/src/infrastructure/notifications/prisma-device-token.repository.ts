import { Injectable, Inject } from '@nestjs/common';
import { IDeviceTokenRepository } from '../../application/notifications/ports/device-token-repository.port';
import { PrismaService } from '../database/prisma.service';
import type { DeviceStatusResponse } from '@designli-challenge/shared';

function maskToken(token: string): string {
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

@Injectable()
export class PrismaDeviceTokenRepository implements IDeviceTokenRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async upsert(userId: number, token: string, platform: string): Promise<void> {
    await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, createdAt: new Date() },
      create: { userId, token, platform, createdAt: new Date() },
    });
  }

  async findByUser(userId: number): Promise<string[]> {
    const records = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return records.map((r) => r.token);
  }

  async getStatusByUser(userId: number): Promise<DeviceStatusResponse> {
    const record = await this.prisma.deviceToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { token: true, platform: true, createdAt: true },
    });

    if (!record) {
      return {
        registered: false,
        platform: null,
        lastRegisteredAt: null,
        tokenPreview: null,
      };
    }

    return {
      registered: true,
      platform: record.platform as 'ios' | 'android',
      lastRegisteredAt: record.createdAt.toISOString(),
      tokenPreview: maskToken(record.token),
    };
  }
}
