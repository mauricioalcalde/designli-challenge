import { Injectable, Inject } from '@nestjs/common';
import { IAlertRepository } from '../../application/alerts/ports/alert-repository.port';
import { Alert } from '../../domain/alerts/alert.entity';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaAlertRepository implements IAlertRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async save(alert: Alert): Promise<Alert> {
    const record = await this.prisma.alert.create({
      data: {
        clientRequestId: alert.clientRequestId,
        userId: alert.userId,
        symbol: alert.symbol,
        threshold: alert.threshold,
        direction: alert.direction,
        active: alert.active,
        lastTriggeredAt: alert.lastTriggeredAt,
      },
    });
    return this.toDomain(record);
  }

  async findByClientRequestId(userId: number, clientRequestId: string): Promise<Alert | null> {
    const record = await this.prisma.alert.findUnique({
      where: { userId_clientRequestId: { userId, clientRequestId } },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAllByUser(userId: number): Promise<Alert[]> {
    const records = await this.prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findAllActive(): Promise<Alert[]> {
    const records = await this.prisma.alert.findMany({
      where: { active: true },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findById(id: number): Promise<Alert | null> {
    const record = await this.prisma.alert.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.alert.delete({ where: { id } });
  }

  async updateLastTriggered(id: number, lastTriggeredAt: Date): Promise<void> {
    await this.prisma.alert.update({
      where: { id },
      data: { lastTriggeredAt },
    });
  }

  private toDomain(record: {
    id: number;
    clientRequestId: string;
    userId: number;
    symbol: string;
    threshold: number;
    direction: string;
    active: boolean;
    lastTriggeredAt: Date | null;
    createdAt: Date;
  }): Alert {
    return new Alert(
      record.id,
      record.clientRequestId,
      record.userId,
      record.symbol,
      record.threshold,
      record.direction as 'above' | 'below',
      record.active,
      record.lastTriggeredAt,
      record.createdAt,
    );
  }
}
