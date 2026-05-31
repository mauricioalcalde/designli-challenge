import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@designli-challenge/shared';
import { ITokenService } from '../../application/auth/ports/token-service.port';
import { User } from '../../domain/auth/user.entity';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async sign(user: User): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.signAsync(payload);
  }

  async verify(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }
}
