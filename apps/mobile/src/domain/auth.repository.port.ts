import type { LoginDTO, RegisterDTO, AuthResponse } from '@designli-challenge/shared';

/**
 * Abstract port for authentication operations.
 * Implemented by the data layer (HTTP API), consumed by the application layer (auth store).
 */
export abstract class AuthRepository {
  abstract login(dto: LoginDTO): Promise<AuthResponse>;
  abstract register(dto: RegisterDTO): Promise<AuthResponse>;
}
