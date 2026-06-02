import { Inject, Injectable, Logger } from '@nestjs/common';
import { AlertNotificationPayload } from '@designli-challenge/shared';
import { Alert } from '../../domain/alerts/alert.entity';
import { IAlertRepository } from './ports/alert-repository.port';
import { IStockProvider } from '../stocks/ports/stock-provider.port';
import { INotificationSender } from '../notifications/ports/notification-sender.port';
import { IDeviceTokenRepository } from '../notifications/ports/device-token-repository.port';

// Evaluator uses a single stock list() per cycle with an explicit/controlled tracked stock set.
// This assumption holds for this challenge's controlled symbol list but would need revisiting
// at scale (where a dynamic subscribed-symbol set would be more appropriate).

@Injectable()
export class AlertEvaluatorService {
  private readonly logger = new Logger(AlertEvaluatorService.name);

  constructor(
    @Inject(IAlertRepository) private readonly alertRepository: IAlertRepository,
    @Inject(IStockProvider) private readonly stockProvider: IStockProvider,
    @Inject(INotificationSender) private readonly notificationSender: INotificationSender,
    @Inject(IDeviceTokenRepository)
    private readonly deviceTokenRepository: IDeviceTokenRepository,
  ) {}

  async evaluateAll(): Promise<void> {
    this.logger.log('Starting alert evaluation cycle');

    const [stocks, alerts] = await Promise.all([
      this.stockProvider.list(),
      this.alertRepository.findAllActive(),
    ]);

    this.logger.log(`Found ${alerts.length} active alert(s) and ${stocks.length} stock(s)`);

    if (alerts.length === 0) return;

    // Build price map from single list() call — O(n) memory, O(1) lookup per alert
    const priceMap = new Map<string, number>();
    for (const stock of stocks) {
      priceMap.set(stock.symbol.toUpperCase(), stock.currentPrice);
      this.logger.debug(`Stock ${stock.symbol}: $${stock.currentPrice}`);
    }

    for (const alert of alerts) {
      await this.evaluateAlert(alert, priceMap);
    }

    this.logger.log('Alert evaluation cycle completed');
  }

  async evaluateAlert(alert: Alert, priceMap?: Map<string, number>): Promise<void> {
    this.logger.log(
      `Evaluating alert #${alert.id}: ${alert.symbol} ${alert.direction} $${alert.threshold}`,
    );

    let currentPrice: number | undefined;

    if (priceMap) {
      currentPrice = priceMap.get(alert.symbol.toUpperCase());
    } else {
      const stocks = await this.stockProvider.list();
      const found = stocks.find((s) => s.symbol.toUpperCase() === alert.symbol.toUpperCase());
      currentPrice = found?.currentPrice;
    }

    if (currentPrice === undefined) {
      this.logger.warn(`No price found for ${alert.symbol}`);
      return;
    }

    this.logger.log(`Current price for ${alert.symbol}: $${currentPrice}`);

    if (!this.isThresholdCrossed(alert.direction, currentPrice, alert.threshold)) {
      this.logger.log(`Threshold not crossed for alert #${alert.id}`);
      return;
    }

    this.logger.log(`✓ Threshold crossed for alert #${alert.id}`);

    const now = Date.now();
    const cooldownMs = this.getCooldownMs();

    // Cooldown check: skip if triggered within the window
    if (alert.lastTriggeredAt) {
      const elapsed = now - alert.lastTriggeredAt.getTime();
      if (elapsed < cooldownMs) {
        this.logger.log(
          `Alert #${alert.id} in cooldown (${Math.round(elapsed / 1000)}s < ${cooldownMs / 1000}s)`,
        );
        return;
      }
    }

    const payload: AlertNotificationPayload = {
      alertId: alert.id,
      userId: alert.userId,
      symbol: alert.symbol,
      currentPrice,
      threshold: alert.threshold,
      direction: alert.direction,
      message: this.buildNotificationMessage(
        alert.symbol,
        alert.direction,
        alert.threshold,
        currentPrice,
      ),
    };

    const deviceTokens = await this.deviceTokenRepository.findByUser(alert.userId);
    this.logger.log(`Found ${deviceTokens.length} device token(s) for user ${alert.userId}`);

    if (deviceTokens.length === 0) {
      this.logger.warn(`No device tokens registered for user ${alert.userId}`);
      return;
    }

    this.logger.log(`Sending notification to ${deviceTokens.length} device(s)`);
    const result = await this.notificationSender.send(alert.userId, payload, deviceTokens);

    if (result.status !== 'sent') {
      this.logger.error(`Failed to send notification: ${result.error || 'unknown error'}`);
      return;
    }

    this.logger.log(`✓ Notification sent successfully for alert #${alert.id}`);
    await this.alertRepository.updateLastTriggered(alert.id, new Date(now));
    this.logger.log(`✓ Updated lastTriggeredAt for alert #${alert.id}`);
  }

  private isThresholdCrossed(
    direction: 'above' | 'below',
    currentPrice: number,
    threshold: number,
  ): boolean {
    if (direction === 'above') return currentPrice >= threshold;
    return currentPrice <= threshold;
  }

  private getCooldownMs(): number {
    const minutes = parseInt(process.env['ALERT_COOLDOWN_MINUTES'] ?? '5', 10);
    return minutes * 60 * 1000;
  }

  private buildNotificationMessage(
    symbol: string,
    direction: 'above' | 'below',
    threshold: number,
    currentPrice: number,
  ): string {
    const thresholdLabel = `$${threshold.toFixed(2)}`;
    const currentLabel = `$${currentPrice.toFixed(2)}`;

    if (currentPrice === threshold) {
      return `${symbol} reached ${thresholdLabel} — current: ${currentLabel}`;
    }

    if (direction === 'above') {
      return `${symbol} moved above ${thresholdLabel} — current: ${currentLabel}`;
    }

    return `${symbol} moved below ${thresholdLabel} — current: ${currentLabel}`;
  }
}
