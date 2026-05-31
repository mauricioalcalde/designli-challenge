import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { AuthModule } from './interfaces/auth/auth.module';
import { StocksModule } from './interfaces/stocks/stocks.module';
import { AlertsModule } from './interfaces/alerts/alerts.module';
import { NotificationsModule } from './interfaces/notifications/notifications.module';
import { AlertEvaluationScheduler } from './infrastructure/scheduler/alert-evaluation.scheduler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    HealthModule,
    AuthModule,
    StocksModule,
    AlertsModule,
    NotificationsModule,
  ],
  providers: [AlertEvaluationScheduler],
})
export class AppModule {}
