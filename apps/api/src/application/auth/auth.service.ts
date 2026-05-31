import { Injectable, Inject } from '@nestjs/common';
import { RegisterDTO, LoginDTO, AuthResponse } from '@designli-challenge/shared';
import { Email } from '../../domain/auth/email.vo';
import { Password } from '../../domain/auth/password.vo';
import { User } from '../../domain/auth/user.entity';
import { EmailAlreadyInUseError, InvalidCredentialsError } from '../../domain/auth/domain-error';
import { IUserRepository } from './ports/user-repository.port';
import { ITokenService } from './ports/token-service.port';
import { IPasswordHasher } from './ports/password-hasher.port';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
    @Inject(IPasswordHasher) private readonly passwordHasher: IPasswordHasher,
    @Inject(ITokenService) private readonly tokenService: ITokenService,
  ) {}

  async register(dto: RegisterDTO): Promise<AuthResponse> {
    const email = Email.create(dto.email);
    Password.create(dto.password);

    const existing = await this.userRepository.findByEmail(email.toString());
    if (existing) {
      throw new EmailAlreadyInUseError(email.toString());
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const user = new User(0, email.toString(), passwordHash, new Date());
    const saved = await this.userRepository.save(user);

    const token = await this.tokenService.sign(saved);

    return {
      token,
      user: { id: saved.id, email: saved.email },
    };
  }

  async login(dto: LoginDTO): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const token = await this.tokenService.sign(user);

    return {
      token,
      user: { id: user.id, email: user.email },
    };
  }
}
