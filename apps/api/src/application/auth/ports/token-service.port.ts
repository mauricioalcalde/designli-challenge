import { User } from '../../../domain/auth/user.entity';
import { JwtPayload } from '@designli-challenge/shared';

export abstract class ITokenService {
  abstract sign(user: User): Promise<string>;
  abstract verify(token: string): Promise<JwtPayload>;
}
