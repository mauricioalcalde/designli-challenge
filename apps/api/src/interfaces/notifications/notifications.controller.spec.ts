import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from '../../application/notifications/notifications.service';
import { IDeviceTokenRepository } from '../../application/notifications/ports/device-token-repository.port';
import { ITokenService } from '../../application/auth/ports/token-service.port';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtPayload } from '@designli-challenge/shared';

describe('NotificationsController (integration)', () => {
  let app: INestApplication;
  let tokenSvc: ITokenService;
  let deviceTokenRepo: IDeviceTokenRepository;

  beforeEach(async () => {
    deviceTokenRepo = {
      upsert: vi.fn(),
      findByUser: vi.fn(),
    } as unknown as IDeviceTokenRepository;

    tokenSvc = {
      sign: vi.fn(),
      verify: vi.fn(),
    } as unknown as ITokenService;

    const notificationsService = new NotificationsService(deviceTokenRepo);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: notificationsService },
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

  describe('POST /devices/token', () => {
    it('should return 201 and register device token', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(deviceTokenRepo.upsert).mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/devices/token')
        .set('Authorization', 'Bearer valid-token')
        .send({ token: 'fcm-token-123', platform: 'android' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ status: 'ok' });
      expect(deviceTokenRepo.upsert).toHaveBeenCalledWith(1, 'fcm-token-123', 'android');
    });

    it('should return 201 on duplicate token (upsert)', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(deviceTokenRepo.upsert).mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/devices/token')
        .set('Authorization', 'Bearer valid-token')
        .send({ token: 'fcm-token-123', platform: 'android' });

      expect(res.status).toBe(201);
    });

    it('should return 401 without Authorization header', async () => {
      const res = await request(app.getHttpServer())
        .post('/devices/token')
        .send({ token: 'fcm-token-123', platform: 'android' });

      expect(res.status).toBe(401);
    });
  });
});
