import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlertEvaluatorService } from './alert-evaluator.service';
import { IAlertRepository } from './ports/alert-repository.port';
import { IStockProvider } from '../stocks/ports/stock-provider.port';
import { INotificationSender } from '../notifications/ports/notification-sender.port';
import { IDeviceTokenRepository } from '../notifications/ports/device-token-repository.port';
import { Alert } from '../../domain/alerts/alert.entity';
import { StockListing, AlertNotificationPayload } from '@designli-challenge/shared';

// Augmented Partial to accept lastNotifiedDirection in overrides for new tests.
// We keep the positional constructor for clarity but allow setting the new field.
function makeAlert(overrides?: {
  id?: number;
  clientRequestId?: string;
  userId?: number;
  symbol?: string;
  threshold?: number;
  direction?: 'above' | 'below';
  active?: boolean;
  lastTriggeredAt?: Date | null;
  lastNotifiedDirection?: 'above' | 'below' | null;
  createdAt?: Date;
}): Alert {
  return new Alert(
    overrides?.id ?? 1,
    overrides?.clientRequestId ?? 'req-1',
    overrides?.userId ?? 1,
    overrides?.symbol ?? 'AAPL',
    overrides?.threshold ?? 180,
    overrides?.direction ?? 'above',
    overrides?.active ?? true,
    overrides?.lastTriggeredAt ?? null,
    overrides?.lastNotifiedDirection ?? null,
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
      updateLastNotifiedDirection: vi.fn(),
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

  describe('state-transition dedup', () => {
    // ── Scenario 1: First-fire always triggers ──────────────────────────
    it('should fire and set direction on first evaluation (lastNotifiedDirection is null)', async () => {
      const alert = makeAlert({
        symbol: 'AAPL',
        direction: 'above',
        threshold: 180,
        lastNotifiedDirection: null,
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([alert]);
      vi.mocked(deviceTokenRepository.findByUser).mockResolvedValue(['token-a']);
      vi.mocked(notificationSender.send).mockResolvedValue({ success: true, status: 'sent' });

      await evaluator.evaluateAll();

      expect(notificationSender.send).toHaveBeenCalledTimes(1);
      expect(alertRepo.updateLastNotifiedDirection).toHaveBeenCalledWith(1, 'above');
    });

    // ── Scenario 2: No-repeat fire while condition persists ─────────────
    it('should NOT fire when lastNotifiedDirection matches the alert direction (already notified)', async () => {
      const alert = makeAlert({
        symbol: 'AAPL',
        direction: 'above',
        threshold: 180,
        lastNotifiedDirection: 'above',
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([alert]);

      await evaluator.evaluateAll();

      expect(notificationSender.send).not.toHaveBeenCalled();
      expect(alertRepo.updateLastNotifiedDirection).not.toHaveBeenCalled();
    });

    it('should NOT fire below alert when lastNotifiedDirection is already below', async () => {
      const alert = makeAlert({
        symbol: 'GOOGL',
        direction: 'below',
        threshold: 135,
        lastNotifiedDirection: 'below',
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([alert]);

      await evaluator.evaluateAll();

      expect(notificationSender.send).not.toHaveBeenCalled();
    });

    // ── Scenario 3: Reset on reverse crossing ───────────────────────────
    it('should reset lastNotifiedDirection to null when price crosses back (above → below threshold)', async () => {
      const alert = makeAlert({
        symbol: 'AAPL',
        direction: 'above',
        threshold: 200, // price 185 is below this threshold → reverse cross
        lastNotifiedDirection: 'above',
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([alert]);

      await evaluator.evaluateAll();

      // Should reset to null because price no longer crosses in the 'above' direction
      expect(alertRepo.updateLastNotifiedDirection).toHaveBeenCalledWith(1, null);
      expect(notificationSender.send).not.toHaveBeenCalled();
    });

    it('should reset lastNotifiedDirection to null when price crosses back (below → above threshold)', async () => {
      const alert = makeAlert({
        symbol: 'AAPL',
        direction: 'below',
        threshold: 150, // price 185 is above this threshold → reverse cross
        lastNotifiedDirection: 'below',
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([alert]);

      await evaluator.evaluateAll();

      expect(alertRepo.updateLastNotifiedDirection).toHaveBeenCalledWith(1, null);
      expect(notificationSender.send).not.toHaveBeenCalled();
    });

    // ── Scenario 4: Re-fire after reset and re-crossing ─────────────────
    it('should re-fire after reset when price crosses again', async () => {
      const alert = makeAlert({
        symbol: 'AAPL',
        direction: 'above',
        threshold: 180,
        lastNotifiedDirection: null, // was reset
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([alert]);
      vi.mocked(deviceTokenRepository.findByUser).mockResolvedValue(['token-a']);
      vi.mocked(notificationSender.send).mockResolvedValue({ success: true, status: 'sent' });

      await evaluator.evaluateAll();

      expect(notificationSender.send).toHaveBeenCalledTimes(1);
      expect(alertRepo.updateLastNotifiedDirection).toHaveBeenCalledWith(1, 'above');
    });

    // ── Cooldown interaction: state-transition passes but cooldown blocks ──
    it('should NOT fire when state-transition allows but cooldown is still active', async () => {
      const alert = makeAlert({
        symbol: 'AAPL',
        direction: 'above',
        threshold: 180,
        lastNotifiedDirection: null, // would normally fire
        lastTriggeredAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago → within 5-min cooldown
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([alert]);

      await evaluator.evaluateAll();

      expect(notificationSender.send).not.toHaveBeenCalled();
      expect(alertRepo.updateLastNotifiedDirection).not.toHaveBeenCalled();
    });

    // ── Existing alert without lastNotifiedDirection set (backward compat) ──
    it('should fire for existing alert with lastNotifiedDirection: null (backward compat)', async () => {
      const alert = makeAlert({
        symbol: 'AAPL',
        direction: 'above',
        threshold: 180,
        lastNotifiedDirection: null,
        lastTriggeredAt: new Date(Date.now() - 10 * 60 * 1000), // outside cooldown
      });

      vi.mocked(stockProvider.list).mockResolvedValue(testStocks);
      vi.mocked(alertRepo.findAllActive).mockResolvedValue([alert]);
      vi.mocked(deviceTokenRepository.findByUser).mockResolvedValue(['token-a']);
      vi.mocked(notificationSender.send).mockResolvedValue({ success: true, status: 'sent' });

      await evaluator.evaluateAll();

      expect(notificationSender.send).toHaveBeenCalledTimes(1);
      expect(alertRepo.updateLastNotifiedDirection).toHaveBeenCalledWith(1, 'above');
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
