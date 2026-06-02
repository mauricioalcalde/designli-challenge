import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from '../../application/alerts/alerts.service';
import { AlertEvaluatorService } from '../../application/alerts/alert-evaluator.service';
import { IAlertRepository } from '../../application/alerts/ports/alert-repository.port';
import { IStockProvider } from '../../application/stocks/ports/stock-provider.port';
import { INotificationSender } from '../../application/notifications/ports/notification-sender.port';
import { IDeviceTokenRepository } from '../../application/notifications/ports/device-token-repository.port';
import { PrismaAlertRepository } from '../../infrastructure/alerts/prisma-alert.repository';
import { MockStockProvider } from '../../infrastructure/stocks/mock-stock.provider';
import { FinnhubStockProvider } from '../../infrastructure/stocks/finnhub-stock.provider';
import { ConsoleNotificationSender } from '../../infrastructure/notifications/console-notification.sender';
import { FirebaseNotificationSender } from '../../infrastructure/notifications/firebase-notification.sender';
import { PrismaDeviceTokenRepository } from '../../infrastructure/notifications/prisma-device-token.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

function createFinnhubProvider() {
  const apiKey = process.env['FINNHUB_API_KEY'];
  if (!apiKey) {
    throw new Error('FINNHUB_API_KEY environment variable is required for stock data');
  }

  return new FinnhubStockProvider(apiKey);
}

@Module({
  imports: [AuthModule],
  controllers: [AlertsController],
  providers: [
    AlertsService,
    AlertEvaluatorService,
    PrismaService,
    JwtAuthGuard,
    { provide: IAlertRepository, useClass: PrismaAlertRepository },
    { provide: IDeviceTokenRepository, useClass: PrismaDeviceTokenRepository },
    {
      provide: IStockProvider,
      useFactory: () => {
        const provider = process.env['STOCK_PROVIDER'] ?? 'finnhub';
        if (provider === 'mock') {
          return new MockStockProvider();
        }

        return createFinnhubProvider();
      },
    },
    {
      provide: INotificationSender,
      useFactory: () => {
        const sender = process.env['NOTIFICATION_SENDER'] ?? 'console';
        if (sender === 'firebase') return new FirebaseNotificationSender();
        return new ConsoleNotificationSender();
      },
    },
  ],
  exports: [IAlertRepository, IDeviceTokenRepository, AlertEvaluatorService, INotificationSender],
})
export class AlertsModule {}
