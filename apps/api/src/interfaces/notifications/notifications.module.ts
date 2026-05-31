import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from '../../application/notifications/notifications.service';
import { IDeviceTokenRepository } from '../../application/notifications/ports/device-token-repository.port';
import { PrismaDeviceTokenRepository } from '../../infrastructure/notifications/prisma-device-token.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PrismaService,
    JwtAuthGuard,
    { provide: IDeviceTokenRepository, useClass: PrismaDeviceTokenRepository },
  ],
})
export class NotificationsModule {}
