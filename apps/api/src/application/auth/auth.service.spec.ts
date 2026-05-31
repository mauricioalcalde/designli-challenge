import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth.service';
import { IUserRepository } from './ports/user-repository.port';
import { ITokenService } from './ports/token-service.port';
import { IPasswordHasher } from './ports/password-hasher.port';
import { User } from '../../domain/auth/user.entity';
import { EmailAlreadyInUseError, InvalidCredentialsError } from '../../domain/auth/domain-error';

function makeUser(overrides?: Partial<User>): User {
  return new User(
    overrides?.id ?? 1,
    overrides?.email ?? 'test@example.com',
    overrides?.passwordHash ?? 'hashed-password',
    overrides?.createdAt ?? new Date('2024-01-01'),
  );
}

function mockUserRepository(): IUserRepository {
  return {
    findByEmail: vi.fn(),
    save: vi.fn(),
  } as unknown as IUserRepository;
}

function mockPasswordHasher(): IPasswordHasher {
  return {
    hash: vi.fn(),
    compare: vi.fn(),
  } as unknown as IPasswordHasher;
}

function mockTokenService(): ITokenService {
  return {
    sign: vi.fn(),
    verify: vi.fn(),
  } as unknown as ITokenService;
}

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user and return a token', async () => {
      const userRepo = mockUserRepository();
      const hasher = mockPasswordHasher();
      const tokenSvc = mockTokenService();

      vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(hasher.hash).mockResolvedValue('hashed-password');
      vi.mocked(userRepo.save).mockImplementation(async (user) => {
        return new User(1, user.email, user.passwordHash, user.createdAt);
      });
      vi.mocked(tokenSvc.sign).mockResolvedValue('jwt-token');

      const service = new AuthService(userRepo as IUserRepository, hasher as IPasswordHasher, tokenSvc as ITokenService);

      const result = await service.register({ email: 'new@example.com', password: 'secret123' });

      expect(result).toEqual({
        token: 'jwt-token',
        user: { id: 1, email: 'new@example.com' },
      });
      expect(userRepo.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(hasher.hash).toHaveBeenCalledWith('secret123');
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(tokenSvc.sign).toHaveBeenCalledTimes(1);
    });

    it('should throw EmailAlreadyInUseError when email is already registered', async () => {
      const userRepo = mockUserRepository();
      const hasher = mockPasswordHasher();
      const tokenSvc = mockTokenService();

      vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser({ email: 'existing@example.com' }));

      const service = new AuthService(userRepo as IUserRepository, hasher as IPasswordHasher, tokenSvc as ITokenService);

      await expect(service.register({ email: 'existing@example.com', password: 'secret123' })).rejects.toThrow(
        EmailAlreadyInUseError,
      );
      expect(hasher.hash).not.toHaveBeenCalled();
      expect(tokenSvc.sign).not.toHaveBeenCalled();
    });

    it('should throw DomainError when email format is invalid', async () => {
      const userRepo = mockUserRepository();
      const hasher = mockPasswordHasher();
      const tokenSvc = mockTokenService();

      const service = new AuthService(userRepo as IUserRepository, hasher as IPasswordHasher, tokenSvc as ITokenService);

      await expect(service.register({ email: 'not-an-email', password: 'secret123' })).rejects.toThrow(
        'Invalid email format',
      );
    });

    it('should throw DomainError when password is too short', async () => {
      const userRepo = mockUserRepository();
      const hasher = mockPasswordHasher();
      const tokenSvc = mockTokenService();

      const service = new AuthService(userRepo as IUserRepository, hasher as IPasswordHasher, tokenSvc as ITokenService);

      await expect(service.register({ email: 'test@example.com', password: '12345' })).rejects.toThrow(
        'Password must be at least 6 characters long',
      );
    });
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
      const userRepo = mockUserRepository();
      const hasher = mockPasswordHasher();
      const tokenSvc = mockTokenService();

      vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser());
      vi.mocked(hasher.compare).mockResolvedValue(true);
      vi.mocked(tokenSvc.sign).mockResolvedValue('jwt-token');

      const service = new AuthService(userRepo as IUserRepository, hasher as IPasswordHasher, tokenSvc as ITokenService);

      const result = await service.login({ email: 'test@example.com', password: 'secret123' });

      expect(result).toEqual({
        token: 'jwt-token',
        user: { id: 1, email: 'test@example.com' },
      });
      expect(hasher.compare).toHaveBeenCalledWith('secret123', 'hashed-password');
    });

    it('should throw InvalidCredentialsError when password is wrong', async () => {
      const userRepo = mockUserRepository();
      const hasher = mockPasswordHasher();
      const tokenSvc = mockTokenService();

      vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser());
      vi.mocked(hasher.compare).mockResolvedValue(false);

      const service = new AuthService(userRepo as IUserRepository, hasher as IPasswordHasher, tokenSvc as ITokenService);

      await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        InvalidCredentialsError,
      );
      expect(tokenSvc.sign).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsError when email is not found', async () => {
      const userRepo = mockUserRepository();
      const hasher = mockPasswordHasher();
      const tokenSvc = mockTokenService();

      vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

      const service = new AuthService(userRepo as IUserRepository, hasher as IPasswordHasher, tokenSvc as ITokenService);

      await expect(service.login({ email: 'unknown@example.com', password: 'secret123' })).rejects.toThrow(
        InvalidCredentialsError,
      );
      expect(hasher.compare).not.toHaveBeenCalled();
    });
  });
});
