import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlertEvaluatorService } from './alert-evaluator.service';
import { IAlertRepository } from './ports/alert-repository.port';
import { IStockProvider } from '../stocks/ports/stock-provider.port';
import { INotificationSender } from '../notifications/ports/notification-sender.port';
import { IDeviceTokenRepository } from '../notifications/ports/device-token-repository.port';
import { Alert } from '../../domain/alerts/alert.entity';
import { StockListing, AlertNotificationPayload } from '@designli-challenge/shared';

function makeAlert(overrides?: Partial<Alert>): Alert {
  return new Alert(
    overrides?.id ?? 1,
    overrides?.clientRequestId ?? 'req-1',
    overrides?.userId ?? 1,
    overrides?.symbol ?? 'AAPL',
    overrides?.threshold ?? 180,
    overrides?.direction ?? 'above',
    overrides?.active ?? true,
    overrides?.lastTriggeredAt ?? null,
    overrides?.createdAt ?? new Date('2024-01-01'),
  );
}

const testStocks: StockListing[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 185, changePercent: 1.5 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 130, changePercent: -0.5 },
];

describe('AlertEvaluatorService', () => {
  let alertRepo: IAlertRepository;
  let stockProvider: IStockProvider;
  let notificationSender: INotificationSender;
  let deviceTokenRepository: IDeviceTokenRepository;
  let evaluator: AlertEvaluatorService;

  beforeEach(() => {
    alertRepo = {
      save: vi.fn(),
      findByClientRequestId: vi.fn(),
      findAllByUser: vi.fn(),
      findAllActive: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
      updateLastTriggered: vi.fn(),
    } as unknown as IAlertRepository;

    stockProvider = {
      list: vi.fn(),
      chart: vi.fn(),
    } as unknown as IStockProvider;

    notificationSender = {
      send: vi.fn(),
    } as unknown as INotificationSender;

    deviceTokenRepository = {
      upsert: vi.fn(),
      findByUser: vi.fn(),
    } as unknown as IDeviceTokenRepository;

    evaluator = new AlertEvaluatorService(
      alertRepo,
      stockProvider,
      notificationSender,
      deviceTokenRepository,
    );
  });

  describe('threshold crossing', () => {
    it('should send notification when price crosses threshold above', async () => {
      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([
        makeAlert({ symbol: 'AAPL', direction: 'above', threshold: 180 }),
      ]);
      vi.mocked(deviceTokenRepository.findByUser).mockResolvedValue(['token-a']);
      vi.mocked(notificationSender.send).mockResolvedValue({ success: true, status: 'sent' });

      await evaluator.evaluateAll();

      expect(notificationSender.send).toHaveBeenCalledTimes(1);
      expect(alertRepo.updateLastTriggered).toHaveBeenCalledTimes(1);
      expect(deviceTokenRepository.findByUser).toHaveBeenCalledWith(1);

      const payload = vi.mocked(notificationSender.send).mock
        .calls[0][1] as AlertNotificationPayload;
      const tokens = vi.mocked(notificationSender.send).mock.calls[0][2] as string[];
      expect(payload.symbol).toBe('AAPL');
      expect(payload.currentPrice).toBe(185);
      expect(tokens).toEqual(['token-a']);
    });

    it('should NOT send notification when price does NOT cross threshold', async () => {
      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([
        makeAlert({ symbol: 'AAPL', direction: 'above', threshold: 200 }), // current price is 185
      ]);

      await evaluator.evaluateAll();

      expect(notificationSender.send).not.toHaveBeenCalled();
      expect(alertRepo.updateLastTriggered).not.toHaveBeenCalled();
    });
  });

  describe('cooldown', () => {
    it('should skip notification when within cooldown window', async () => {
      // Triggered 2 minutes ago — within default 5-min cooldown
      const justTriggered = makeAlert({
        symbol: 'AAPL',
        direction: 'above',
        threshold: 180,
        lastTriggeredAt: new Date(Date.now() - 2 * 60 * 1000),
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([justTriggered]);

      await evaluator.evaluateAll();

      expect(notificationSender.send).not.toHaveBeenCalled();
    });

    it('should send notification when cooldown has expired', async () => {
      // Triggered 6 minutes ago — outside default 5-min cooldown
      const oldTrigger = makeAlert({
        symbol: 'AAPL',
        direction: 'above',
        threshold: 180,
        lastTriggeredAt: new Date(Date.now() - 6 * 60 * 1000),
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([oldTrigger]);
      vi.mocked(deviceTokenRepository.findByUser).mockResolvedValue(['token-a']);
      vi.mocked(notificationSender.send).mockResolvedValue({ success: true, status: 'sent' });

      await evaluator.evaluateAll();

      expect(notificationSender.send).toHaveBeenCalledTimes(1);
      expect(alertRepo.updateLastTriggered).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should skip alerts for symbols not in stock list', async () => {
      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([
        makeAlert({ symbol: 'MSFT', direction: 'above', threshold: 300 }),
      ]);

      await evaluator.evaluateAll();

      expect(notificationSender.send).not.toHaveBeenCalled();
    });

    it('should handle empty active alerts gracefully', async () => {
      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([]);

      await evaluator.evaluateAll();

      expect(notificationSender.send).not.toHaveBeenCalled();
    });

    it('should trigger for below-direction when price drops below threshold', async () => {
      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([
        makeAlert({ symbol: 'GOOGL', direction: 'below', threshold: 135 }),
      ]);
      vi.mocked(deviceTokenRepository.findByUser).mockResolvedValue(['token-b']);
      vi.mocked(notificationSender.send).mockResolvedValue({ success: true, status: 'sent' });

      await evaluator.evaluateAll();

      expect(notificationSender.send).toHaveBeenCalledTimes(1);
    });

    it('should skip delivery and last-trigger update when no persisted tokens exist', async () => {
      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([
        makeAlert({ symbol: 'AAPL', direction: 'above', threshold: 180 }),
      ]);
      vi.mocked(deviceTokenRepository.findByUser).mockResolvedValue([]);

      await evaluator.evaluateAll();

      expect(deviceTokenRepository.findByUser).toHaveBeenCalledWith(1);
      expect(notificationSender.send).not.toHaveBeenCalled();
      expect(alertRepo.updateLastTriggered).not.toHaveBeenCalled();
    });

    it('should not update last-triggered when sender reports skipped delivery', async () => {
      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([
        makeAlert({ symbol: 'AAPL', direction: 'above', threshold: 180 }),
      ]);
      vi.mocked(deviceTokenRepository.findByUser).mockResolvedValue(['token-a']);
      vi.mocked(notificationSender.send).mockResolvedValue({ success: false, status: 'skipped' });

      await evaluator.evaluateAll();

      expect(notificationSender.send).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ alertId: 1, symbol: 'AAPL' }),
        ['token-a'],
      );
      expect(alertRepo.updateLastTriggered).not.toHaveBeenCalled();
    });

    it('should not update last-triggered when sender reports failed delivery', async () => {
      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([
        makeAlert({ symbol: 'AAPL', direction: 'above', threshold: 180 }),
      ]);
      vi.mocked(deviceTokenRepository.findByUser).mockResolvedValue(['token-a']);
      vi.mocked(notificationSender.send).mockResolvedValue({
        success: false,
        status: 'failed',
        error: 'FCM send failed',
      });

      await evaluator.evaluateAll();

      expect(notificationSender.send).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ alertId: 1, symbol: 'AAPL' }),
        ['token-a'],
      );
      expect(alertRepo.updateLastTriggered).not.toHaveBeenCalled();
    });
  });
});
