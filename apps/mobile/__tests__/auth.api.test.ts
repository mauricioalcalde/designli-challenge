import type { AxiosInstance } from 'axios';
import type { AuthResponse, LoginDTO, RegisterDTO } from '@designli-challenge/shared';
import { AuthApi } from '../src/data/auth.api';
import { AuthError } from '../src/domain/auth-errors';

describe('AuthApi', () => {
  let client: Pick<AxiosInstance, 'post'>;
  let authApi: AuthApi;

  beforeEach(() => {
    client = {
      post: jest.fn(),
    };

    authApi = new AuthApi(client as AxiosInstance);
  });

  it('posts LoginDTO to /auth/login and returns AuthResponse', async () => {
    const dto: LoginDTO = {
      email: 'user@example.com',
      password: 'securePass1',
    };
    const response: AuthResponse = {
      token: 'jwt-token',
      user: { id: 1, email: dto.email },
    };

    (client.post as jest.Mock).mockResolvedValue({ data: response });

    await expect(authApi.login(dto)).resolves.toEqual(response);
    expect(client.post).toHaveBeenCalledWith('/auth/login', dto);
  });

  it('rejects login with AuthError when the client rejects auth failure', async () => {
    const dto: LoginDTO = {
      email: 'user@example.com',
      password: 'wrong-pass',
    };

    (client.post as jest.Mock).mockRejectedValue(new AuthError('Invalid credentials'));

    await expect(authApi.login(dto)).rejects.toBeInstanceOf(AuthError);
    expect(client.post).toHaveBeenCalledWith('/auth/login', dto);
  });

  it('posts RegisterDTO to /auth/register and returns AuthResponse', async () => {
    const dto: RegisterDTO = {
      email: 'new@example.com',
      password: 'securePass1',
    };
    const response: AuthResponse = {
      token: 'register-token',
      user: { id: 2, email: dto.email },
    };

    (client.post as jest.Mock).mockResolvedValue({ data: response });

    await expect(authApi.register(dto)).resolves.toEqual(response);
    expect(client.post).toHaveBeenCalledWith('/auth/register', dto);
  });
});
