import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaAlertRepository } from './prisma-alert.repository';
import { PrismaService } from '../database/prisma.service';
import { Alert } from '../../domain/alerts/alert.entity';

function makePrismaRecord(overrides?: Record<string, unknown>) {
  return {
    id: 1,
    clientRequestId: 'req-1',
    userId: 1,
    symbol: 'AAPL',
    threshold: 180,
    direction: 'above',
    active: true,
    lastTriggeredAt: null,
    lastNotifiedDirection: null,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('PrismaAlertRepository', () => {
  let prisma: PrismaService;
  let repo: PrismaAlertRepository;

  beforeEach(() => {
    prisma = {
      alert: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaService;
    repo = new PrismaAlertRepository(prisma);
  });

  describe('toDomain mapping (lastNotifiedDirection)', () => {
    it('should map lastNotifiedDirection: null correctly', async () => {
      const record = makePrismaRecord({ lastNotifiedDirection: null });
      vi.mocked(prisma.alert.findUnique).mockResolvedValue(record);

      const result = await repo.findById(1);

      expect(result).not.toBeNull();
      expect(result!.lastNotifiedDirection).toBeNull();
    });

    it('should map lastNotifiedDirection: "above" correctly', async () => {
      const record = makePrismaRecord({ lastNotifiedDirection: 'above' });
      vi.mocked(prisma.alert.findUnique).mockResolvedValue(record);

      const result = await repo.findById(1);

      expect(result).not.toBeNull();
      expect(result!.lastNotifiedDirection).toBe('above');
    });

    it('should map lastNotifiedDirection: "below" correctly', async () => {
      const record = makePrismaRecord({ lastNotifiedDirection: 'below' });
      vi.mocked(prisma.alert.findUnique).mockResolvedValue(record);

      const result = await repo.findById(1);

      expect(result).not.toBeNull();
      expect(result!.lastNotifiedDirection).toBe('below');
    });
  });

  describe('updateLastNotifiedDirection', () => {
    it('should call prisma.alert.update with the given id and direction', async () => {
      vi.mocked(prisma.alert.update).mockResolvedValue(makePrismaRecord());

      await repo.updateLastNotifiedDirection(1, 'above');

      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastNotifiedDirection: 'above' },
      });
    });

    it('should accept null to reset direction', async () => {
      vi.mocked(prisma.alert.update).mockResolvedValue(
        makePrismaRecord({ lastNotifiedDirection: null }),
      );

      await repo.updateLastNotifiedDirection(5, null);

      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { lastNotifiedDirection: null },
      });
    });
  });

  describe('save includes lastNotifiedDirection', () => {
    it('should pass lastNotifiedDirection in create data', async () => {
      const alert = new Alert(
        0, // id ignored on create
        'req-new',
        2,
        'TSLA',
        250,
        'above',
        true,
        null,
        'above',
        new Date('2024-06-01'),
      );
      vi.mocked(prisma.alert.create).mockResolvedValue(makePrismaRecord({ id: 2 }));

      await repo.save(alert);

      expect(prisma.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clientRequestId: 'req-new',
          userId: 2,
          symbol: 'TSLA',
          threshold: 250,
          direction: 'above',
          active: true,
          lastTriggeredAt: null,
          lastNotifiedDirection: 'above',
        }),
      });
    });
  });
});
