import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlertsService } from './alerts.service';
import { IAlertRepository } from './ports/alert-repository.port';
import { AlertEvaluatorService } from './alert-evaluator.service';
import { Alert } from '../../domain/alerts/alert.entity';
import { AlertAlreadyExistsError, AlertNotFoundError } from '../../domain/alerts/alert-errors';

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

describe('AlertsService', () => {
  let alertRepo: IAlertRepository;
  let alertEvaluator: AlertEvaluatorService;
  let service: AlertsService;

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

    alertEvaluator = {
      evaluateAlert: vi.fn(),
      evaluateAll: vi.fn(),
    } as unknown as AlertEvaluatorService;

    service = new AlertsService(alertRepo, alertEvaluator);
  });

  describe('create (idempotency)', () => {
    it('should throw AlertAlreadyExistsError when clientRequestId already exists', async () => {
      vi.mocked(alertRepo.findByClientRequestId).mockResolvedValue(
        makeAlert({ clientRequestId: 'abc-123' }),
      );

      await expect(
        service.create(1, 'abc-123', { symbol: 'AAPL', threshold: 180, direction: 'above' }),
      ).rejects.toThrow(AlertAlreadyExistsError);

      expect(alertRepo.save).not.toHaveBeenCalled();
    });

    it('should throw AlertAlreadyExistsError on P2002 race condition', async () => {
      vi.mocked(alertRepo.findByClientRequestId).mockResolvedValue(null);
      const p2002Error: Error & { code: string } = Object.assign(
        new Error('Unique constraint failed'),
        { code: 'P2002' },
      );
      vi.mocked(alertRepo.save).mockRejectedValue(p2002Error);

      await expect(
        service.create(1, 'abc-123', { symbol: 'AAPL', threshold: 180, direction: 'above' }),
      ).rejects.toThrow(AlertAlreadyExistsError);
    });

    it('should create alert successfully when no duplicate exists', async () => {
      vi.mocked(alertRepo.findByClientRequestId).mockResolvedValue(null);
      vi.mocked(alertRepo.save).mockImplementation(async (alert) => {
        return new Alert(
          42,
          alert.clientRequestId,
          alert.userId,
          alert.symbol,
          alert.threshold,
          alert.direction,
          alert.active,
          alert.lastTriggeredAt,
          alert.createdAt,
        );
      });

      const result = await service.create(1, 'new-key', {
        symbol: 'AAPL',
        threshold: 180,
        direction: 'above',
      });

      expect(result.id).toBe(42);
      expect(result.symbol).toBe('AAPL');
      expect(alertRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw for invalid direction', async () => {
      vi.mocked(alertRepo.findByClientRequestId).mockResolvedValue(null);

      await expect(
        service.create(1, 'key-1', {
          symbol: 'AAPL',
          threshold: 180,
          direction: 'sideways' as 'above',
        }),
      ).rejects.toThrow('Invalid alert direction');
    });
  });

  describe('findAll', () => {
    it('should return only alerts for the specified user', async () => {
      vi.mocked(alertRepo.findAllByUser).mockResolvedValue([
        makeAlert({ id: 1, userId: 1, symbol: 'AAPL' }),
        makeAlert({ id: 2, userId: 1, symbol: 'GOOGL' }),
      ]);

      const result = await service.findAll(1);
      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('AAPL');
    });
  });

  describe('delete', () => {
    it('should delete alert belonging to the user', async () => {
      vi.mocked(alertRepo.findById).mockResolvedValue(makeAlert({ id: 1, userId: 1 }));
      await service.delete(1, 1);
      expect(alertRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should not delete alert belonging to a different user', async () => {
      vi.mocked(alertRepo.findById).mockResolvedValue(makeAlert({ id: 1, userId: 2 }));
      await expect(service.delete(1, 1)).rejects.toThrow(AlertNotFoundError);
      expect(alertRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw when alert does not exist', async () => {
      vi.mocked(alertRepo.findById).mockResolvedValue(null);
      await expect(service.delete(1, 999)).rejects.toThrow(AlertNotFoundError);
      expect(alertRepo.delete).not.toHaveBeenCalled();
    });
  });
});
