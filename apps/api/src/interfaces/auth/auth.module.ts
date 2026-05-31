import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/auth/auth.service';
import { IUserRepository } from '../../application/auth/ports/user-repository.port';
import { ITokenService } from '../../application/auth/ports/token-service.port';
import { IPasswordHasher } from '../../application/auth/ports/password-hasher.port';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrismaUserRepository } from '../../infrastructure/auth/prisma-user.repository';
import { JwtTokenService } from '../../infrastructure/auth/jwt-token.service';
import { BcryptPasswordHasher } from '../../infrastructure/auth/bcrypt-password.hasher';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    { provide: IUserRepository, useClass: PrismaUserRepository },
    { provide: ITokenService, useClass: JwtTokenService },
    { provide: IPasswordHasher, useClass: BcryptPasswordHasher },
    AuthService,
    JwtAuthGuard,
  ],
  exports: [IUserRepository, ITokenService, JwtAuthGuard],
})
export class AuthModule {}
