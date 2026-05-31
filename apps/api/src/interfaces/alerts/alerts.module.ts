import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from '../../application/alerts/alerts.service';
import { AlertEvaluatorService } from '../../application/alerts/alert-evaluator.service';
import { IAlertRepository } from '../../application/alerts/ports/alert-repository.port';
import { IStockProvider } from '../../application/stocks/ports/stock-provider.port';
import { INotificationSender } from '../../application/notifications/ports/notification-sender.port';
import { PrismaAlertRepository } from '../../infrastructure/alerts/prisma-alert.repository';
import { MockStockProvider } from '../../infrastructure/stocks/mock-stock.provider';
import { FinnhubStockProvider } from '../../infrastructure/stocks/finnhub-stock.provider';
import { ConsoleNotificationSender } from '../../infrastructure/notifications/console-notification.sender';
import { FirebaseNotificationSender } from '../../infrastructure/notifications/firebase-notification.sender';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AlertsController],
  providers: [
    AlertsService,
    AlertEvaluatorService,
    PrismaService,
    JwtAuthGuard,
    { provide: IAlertRepository, useClass: PrismaAlertRepository },
    {
      provide: IStockProvider,
      // Shared: same provider factory logic as StocksModule.
      // In production, extract to a shared provider module.
      useFactory: () => {
        const provider = process.env['STOCK_PROVIDER'] ?? 'mock';
        if (provider === 'finnhub') {
          const apiKey = process.env['FINNHUB_API_KEY'];
          if (!apiKey) {
            throw new Error(
              'FINNHUB_API_KEY environment variable is required when STOCK_PROVIDER=finnhub',
            );
          }
          return new FinnhubStockProvider(apiKey);
        }
        return new MockStockProvider();
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
  exports: [IAlertRepository, AlertEvaluatorService, INotificationSender],
})
export class AlertsModule {}
