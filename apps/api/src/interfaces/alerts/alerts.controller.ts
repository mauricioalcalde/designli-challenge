import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Headers,
  HttpCode,
  Param,
  ParseIntPipe,
  UseGuards,
  ConflictException,
  Inject,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreateAlertDTO, AlertResponse } from '@designli-challenge/shared';
import { AlertsService } from '../../application/alerts/alerts.service';
import { AlertAlreadyExistsError, AlertNotFoundError } from '../../domain/alerts/alert-errors';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(
    @Inject(AlertsService) private readonly alertsService: AlertsService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateAlertDTO,
    @Headers('idempotency-key') idempotencyKey: string,
    @Req() req: Request,
  ): Promise<AlertResponse> {
    const user = (req as unknown as Record<string, { sub: number }>).user;
    const userId = user.sub;

    if (!idempotencyKey) {
      throw new ConflictException('Idempotency-Key header is required');
    }

    try {
      return await this.alertsService.create(userId, idempotencyKey, dto);
    } catch (error) {
      if (error instanceof AlertAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Get()
  async findAll(@Req() req: Request): Promise<AlertResponse[]> {
    const user = (req as unknown as Record<string, { sub: number }>).user;
    return this.alertsService.findAll(user.sub);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<void> {
    const user = (req as unknown as Record<string, { sub: number }>).user;
    try {
      return await this.alertsService.delete(user.sub, id);
    } catch (error) {
      if (error instanceof AlertNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
