import { Controller, Get, Post, Body, HttpCode, UseGuards, Inject, Req } from '@nestjs/common';
import { DeviceStatusResponse, DeviceTokenDTO } from '@designli-challenge/shared';
import { NotificationsService } from '../../application/notifications/notifications.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('devices')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('token')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async registerToken(
    @Body() dto: DeviceTokenDTO,
    @Req() req: Request,
  ): Promise<{ status: string }> {
    const user = (req as unknown as Record<string, { sub: number }>).user;
    await this.notificationsService.registerToken(user.sub, dto);
    return { status: 'ok' };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: Request): Promise<DeviceStatusResponse> {
    const user = (req as unknown as Record<string, { sub: number }>).user;
    return this.notificationsService.getStatus(user.sub);
  }
}
