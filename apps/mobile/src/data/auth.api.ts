import type { LoginDTO, RegisterDTO, AuthResponse } from '@designli-challenge/shared';
import { AuthRepository } from '../domain/auth.repository.port';
import { apiFetch } from './apiFetch';

/**
 * HTTP implementation of AuthRepository.
 * Uses native fetch through apiFetch wrapper.
 */
export class AuthApi extends AuthRepository {
  constructor() {
    super();
  }

  async login(dto: LoginDTO): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: dto,
    });
  }

  async register(dto: RegisterDTO): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: dto,
    });
  }
}
