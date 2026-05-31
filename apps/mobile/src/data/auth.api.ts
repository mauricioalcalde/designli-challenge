import type { AxiosInstance } from 'axios';
import type { LoginDTO, RegisterDTO, AuthResponse } from '@designli-challenge/shared';
import { AuthRepository } from '../domain/auth.repository.port';

/**
 * HTTP implementation of AuthRepository.
 * Delegates to the pre-configured Axios client created by api-client.ts.
 */
export class AuthApi extends AuthRepository {
  constructor(private readonly client: AxiosInstance) {
    super();
  }

  async login(dto: LoginDTO): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', dto);
    return data;
  }

  async register(dto: RegisterDTO): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/register', dto);
    return data;
  }
}
