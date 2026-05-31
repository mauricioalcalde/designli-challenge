import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AlertsController } from './alerts.controller';
import { AlertsService } from '../../application/alerts/alerts.service';
import { IAlertRepository } from '../../application/alerts/ports/alert-repository.port';
import { ITokenService } from '../../application/auth/ports/token-service.port';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtPayload, AlertResponse } from '@designli-challenge/shared';

const mockAlert: AlertResponse = {
  id: 1,
  userId: 1,
  symbol: 'AAPL',
  threshold: 180,
  direction: 'above',
  active: true,
  lastTriggeredAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('AlertsController (integration)', () => {
  let app: INestApplication;
  let alertsService: AlertsService;
  let tokenSvc: ITokenService;
  let alertRepo: IAlertRepository;

  beforeEach(async () => {
    alertRepo = {
      save: vi.fn(),
      findByClientRequestId: vi.fn(),
      findAllByUser: vi.fn(),
      findAllActive: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
      updateLastTriggered: vi.fn(),
    } as unknown as IAlertRepository;

    tokenSvc = {
      sign: vi.fn(),
      verify: vi.fn(),
    } as unknown as ITokenService;

    alertsService = new AlertsService(alertRepo);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [
        { provide: AlertsService, useValue: alertsService },
        { provide: ITokenService, useValue: tokenSvc },
        JwtAuthGuard,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /alerts (idempotency)', () => {
    it('should return 201 on first request with Idempotency-Key', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(alertRepo.findByClientRequestId).mockResolvedValue(null);
      vi.mocked(alertRepo.save).mockResolvedValue({
        ...mockAlert,
        id: mockAlert.id,
        clientRequestId: 'key-1',
        userId: 1,
        symbol: 'AAPL',
        threshold: 180,
        direction: 'above' as const,
        active: true,
        lastTriggeredAt: null,
        createdAt: new Date('2024-01-01'),
      } as unknown as import('../../domain/alerts/alert.entity').Alert);

      const res = await request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', 'Bearer valid-token')
        .set('Idempotency-Key', 'key-1')
        .send({ symbol: 'AAPL', threshold: 180, direction: 'above' });

      expect(res.status).toBe(201);
      expect(res.body.symbol).toBe('AAPL');
    });

    it('should return 409 on duplicate Idempotency-Key', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(alertRepo.findByClientRequestId).mockResolvedValue({
        id: 1,
        clientRequestId: 'dup-key',
        userId: 1,
        symbol: 'AAPL',
        threshold: 180,
        direction: 'above' as const,
        active: true,
        lastTriggeredAt: null,
        createdAt: new Date('2024-01-01'),
      } as import('../../domain/alerts/alert.entity').Alert);

      const res = await request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', 'Bearer valid-token')
        .set('Idempotency-Key', 'dup-key')
        .send({ symbol: 'AAPL', threshold: 180, direction: 'above' });

      expect(res.status).toBe(409);
    });

    it('should return 401 when no Authorization header', async () => {
      const res = await request(app.getHttpServer())
        .post('/alerts')
        .set('Idempotency-Key', 'key-1')
        .send({ symbol: 'AAPL', threshold: 180, direction: 'above' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /alerts', () => {
    it('should return 200 with user-scoped alerts', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(alertRepo.findAllByUser).mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('DELETE /alerts/:id', () => {
    it('should return 204 when deleting own alert', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(alertRepo.findById).mockResolvedValue({
        id: 1,
        userId: 1,
        symbol: 'AAPL',
        threshold: 180,
        direction: 'above' as const,
        active: true,
        clientRequestId: 'req-1',
        lastTriggeredAt: null,
        createdAt: new Date(),
      } as import('../../domain/alerts/alert.entity').Alert);

      const res = await request(app.getHttpServer())
        .delete('/alerts/1')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(204);
    });

    it('should return 404 when deleting an alert owned by a different user', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(alertRepo.findById).mockResolvedValue({
        id: 1,
        userId: 2,
        symbol: 'AAPL',
        threshold: 180,
        direction: 'above' as const,
        active: true,
        clientRequestId: 'req-1',
        lastTriggeredAt: null,
        createdAt: new Date(),
      } as import('../../domain/alerts/alert.entity').Alert);

      const res = await request(app.getHttpServer())
        .delete('/alerts/1')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
    });
  });
});
