import {
  Injectable,
  Inject,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ITokenService } from '../../application/auth/ports/token-service.port';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(ITokenService) private readonly tokenService: ITokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.slice(7);

    try {
      const payload = await this.tokenService.verify(token);
      (request as unknown as Record<string, unknown>).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
