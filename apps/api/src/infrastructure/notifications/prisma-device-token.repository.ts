import { Injectable, Inject } from '@nestjs/common';
import { IDeviceTokenRepository } from '../../application/notifications/ports/device-token-repository.port';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaDeviceTokenRepository implements IDeviceTokenRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async upsert(userId: number, token: string, platform: string): Promise<void> {
    // Upsert: if token exists for any user, update; otherwise create
    await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async findByUser(userId: number): Promise<string[]> {
    const records = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return records.map((r) => r.token);
  }
}
