import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, UseGuards } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/auth/auth.service';
import { IUserRepository } from '../../application/auth/ports/user-repository.port';
import { ITokenService } from '../../application/auth/ports/token-service.port';
import { IPasswordHasher } from '../../application/auth/ports/password-hasher.port';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { User } from '../../domain/auth/user.entity';
import { JwtPayload } from '@designli-challenge/shared';

function makeUser(overrides?: Partial<User>): User {
  return new User(
    overrides?.id ?? 1,
    overrides?.email ?? 'test@example.com',
    overrides?.passwordHash ?? 'hashed-password',
    overrides?.createdAt ?? new Date('2024-01-01'),
  );
}

@Controller('protected')
class TestProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtected(): { data: string } {
    return { data: 'secret' };
  }
}

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let userRepo: IUserRepository;
  let hasher: IPasswordHasher;
  let tokenSvc: ITokenService;

  beforeEach(async () => {
    userRepo = {
      findByEmail: vi.fn(),
      save: vi.fn(),
    } as unknown as IUserRepository;

    hasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

    tokenSvc = {
      sign: vi.fn(),
      verify: vi.fn(),
    } as unknown as ITokenService;

    const authService = new AuthService(userRepo, hasher, tokenSvc);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, TestProtectedController],
      providers: [
        { provide: AuthService, useValue: authService },
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

  describe('POST /auth/register', () => {
    it('should return 201 and token + user on success', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(hasher.hash).mockResolvedValue('hashed-password');
      vi.mocked(userRepo.save).mockImplementation(async (u: User) =>
        new User(1, u.email, u.passwordHash, u.createdAt),
      );
      vi.mocked(tokenSvc.sign).mockResolvedValue('jwt-token');

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new@example.com', password: 'secret123' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        token: 'jwt-token',
        user: { id: 1, email: 'new@example.com' },
      });
    });

    it('should return 409 when email already exists', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser({ email: 'existing@example.com' }));

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'existing@example.com', password: 'secret123' });

      expect(res.status).toBe(409);
    });

    it('should return 400 when email format is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'secret123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 and token + user on success', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser());
      vi.mocked(hasher.compare).mockResolvedValue(true);
      vi.mocked(tokenSvc.sign).mockResolvedValue('jwt-token');

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'secret123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        token: 'jwt-token',
        user: { id: 1, email: 'test@example.com' },
      });
    });

    it('should return 401 when password is wrong', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser());
      vi.mocked(hasher.compare).mockResolvedValue(false);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('should return 401 when email is not found', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'unknown@example.com', password: 'secret123' });

      expect(res.status).toBe(401);
    });
  });

  describe('JwtAuthGuard', () => {
    it('should return 401 when no Authorization header is present', async () => {
      const res = await request(app.getHttpServer()).get('/protected');
      expect(res.status).toBe(401);
    });

    it('should return 200 when valid Bearer token is provided', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({ sub: 1, email: 'test@example.com' } as JwtPayload);

      const res = await request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: 'secret' });
    });

    it('should return 401 when token is invalid or expired', async () => {
      vi.mocked(tokenSvc.verify).mockRejectedValue(new Error('jwt malformed'));

      const res = await request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', 'Bearer bad-token');

      expect(res.status).toBe(401);
    });
  });
});
