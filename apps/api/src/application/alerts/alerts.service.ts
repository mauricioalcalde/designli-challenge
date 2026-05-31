import { Injectable, Inject } from '@nestjs/common';
import { CreateAlertDTO, AlertResponse } from '@designli-challenge/shared';
import { Alert } from '../../domain/alerts/alert.entity';
import { AlertDirection } from '../../domain/alerts/alert-direction.vo';
import { AlertAlreadyExistsError, AlertNotFoundError } from '../../domain/alerts/alert-errors';
import { IAlertRepository } from './ports/alert-repository.port';

@Injectable()
export class AlertsService {
  constructor(
    @Inject(IAlertRepository) private readonly alertRepository: IAlertRepository,
  ) {}

  async create(userId: number, clientRequestId: string, dto: CreateAlertDTO): Promise<AlertResponse> {
    const existing = await this.alertRepository.findByClientRequestId(userId, clientRequestId);
    if (existing) {
      throw new AlertAlreadyExistsError(clientRequestId);
    }

    AlertDirection.create(dto.direction);

    const alert = new Alert(
      0,
      clientRequestId,
      userId,
      dto.symbol,
      dto.threshold,
      dto.direction,
      true,
      null,
      new Date(),
    );

    try {
      const saved = await this.alertRepository.save(alert);
      return this.toResponse(saved);
    } catch (error: unknown) {
      // Prisma P2002: unique constraint violation (race condition / duplicate)
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new AlertAlreadyExistsError(clientRequestId);
      }
      throw error;
    }
  }

  async findAll(userId: number): Promise<AlertResponse[]> {
    const alerts = await this.alertRepository.findAllByUser(userId);
    return alerts.map((a) => this.toResponse(a));
  }

  async delete(userId: number, id: number): Promise<void> {
    const alert = await this.alertRepository.findById(id);
    if (!alert || alert.userId !== userId) {
      throw new AlertNotFoundError(id);
    }
    await this.alertRepository.delete(id);
  }

  private toResponse(alert: Alert): AlertResponse {
    return {
      id: alert.id,
      userId: alert.userId,
      symbol: alert.symbol,
      threshold: alert.threshold,
      direction: alert.direction,
      active: alert.active,
      lastTriggeredAt: alert.lastTriggeredAt?.toISOString() ?? null,
      createdAt: alert.createdAt.toISOString(),
    };
  }
}
