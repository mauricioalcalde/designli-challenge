import { Inject, Injectable } from '@nestjs/common';
import { AlertNotificationPayload } from '@designli-challenge/shared';
import { IAlertRepository } from './ports/alert-repository.port';
import { IStockProvider } from '../stocks/ports/stock-provider.port';
import { INotificationSender } from '../notifications/ports/notification-sender.port';

// Evaluator uses a single stock list() per cycle with an explicit/controlled tracked stock set.
// This assumption holds for this challenge's controlled symbol list but would need revisiting
// at scale (where a dynamic subscribed-symbol set would be more appropriate).

@Injectable()
export class AlertEvaluatorService {
  constructor(
    @Inject(IAlertRepository) private readonly alertRepository: IAlertRepository,
    @Inject(IStockProvider) private readonly stockProvider: IStockProvider,
    @Inject(INotificationSender) private readonly notificationSender: INotificationSender,
  ) {}

  async evaluateAll(): Promise<void> {
    const [stocks, alerts] = await Promise.all([
      this.stockProvider.list(),
      this.alertRepository.findAllActive(),
    ]);

    if (alerts.length === 0) return;

    // Build price map from single list() call — O(n) memory, O(1) lookup per alert
    const priceMap = new Map<string, number>();
    for (const stock of stocks) {
      priceMap.set(stock.symbol.toUpperCase(), stock.currentPrice);
    }

    const now = Date.now();
    const cooldownMs = this.getCooldownMs();

    for (const alert of alerts) {
      const currentPrice = priceMap.get(alert.symbol.toUpperCase());
      if (currentPrice === undefined) continue;

      if (!this.isThresholdCrossed(alert.direction, currentPrice, alert.threshold)) {
        continue;
      }

      // Cooldown check: skip if triggered within the window
      if (alert.lastTriggeredAt) {
        const elapsed = now - alert.lastTriggeredAt.getTime();
        if (elapsed < cooldownMs) continue;
      }

      const payload: AlertNotificationPayload = {
        alertId: alert.id,
        userId: alert.userId,
        symbol: alert.symbol,
        currentPrice,
        threshold: alert.threshold,
        direction: alert.direction,
        message: `${alert.symbol} is ${alert.direction} $${alert.threshold} — current: $${currentPrice}`,
      };

      await this.notificationSender.send(alert.userId, payload);
      await this.alertRepository.updateLastTriggered(alert.id, new Date(now));
    }
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
}
