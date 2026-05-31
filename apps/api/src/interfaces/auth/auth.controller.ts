import {
  Controller,
  Post,
  Body,
  HttpCode,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { RegisterDTO, LoginDTO, AuthResponse } from '@designli-challenge/shared';
import { AuthService } from '../../application/auth/auth.service';
import { EmailAlreadyInUseError, InvalidCredentialsError } from '../../domain/auth/domain-error';
import { DomainError } from '../../domain/auth/domain-error';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDTO): Promise<AuthResponse> {
    try {
      return await this.authService.register(dto);
    } catch (error) {
      if (error instanceof EmailAlreadyInUseError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof DomainError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDTO): Promise<AuthResponse> {
    try {
      return await this.authService.login(dto);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
