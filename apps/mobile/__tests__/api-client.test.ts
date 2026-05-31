import axios from 'axios';
import { createApiClient } from '../src/data/api-client';
import { MmkvTokenStorage } from '../src/data/token-storage.mmkv';
import { NetworkError, AuthError, ServerError } from '../src/domain/auth-errors';

jest.mock('axios');

describe('createApiClient', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRequestInterceptor: (config: any) => any;
  let mockResponseErrorInterceptor: (error: Record<string, unknown>) => Promise<unknown>;

  const mockClient = {
    interceptors: {
      request: {
        use: jest.fn((onFulfilled: unknown) => {
          mockRequestInterceptor = onFulfilled as typeof mockRequestInterceptor;
        }),
      },
      response: {
        use: jest.fn(
          (
            _onFulfilled: unknown,
            onRejected: unknown,
          ) => {
            mockResponseErrorInterceptor = onRejected as typeof mockResponseErrorInterceptor;
          },
        ),
      },
    },
  };

  const mockTokenStorage = {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  };

  const onLoggedOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (axios.create as jest.Mock).mockReturnValue(mockClient);
    createApiClient('http://localhost:3000/api', mockTokenStorage, onLoggedOut);
  });

  // --- Boot ---

  it('creates axios instance with the given base URL', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000/api',
    });
  });

  // --- R3: Token Injection ---

  it('injects Bearer token into Authorization header when token exists', () => {
    mockTokenStorage.get.mockReturnValue('stored-jwt');
    const config = mockRequestInterceptor({ headers: {} });
    expect(config.headers).toEqual({
      Authorization: 'Bearer stored-jwt',
    });
  });

  it('does not inject Authorization header when no token is stored', () => {
    mockTokenStorage.get.mockReturnValue(null);
    const config = mockRequestInterceptor({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  // --- R5: Error Mapping ---

  it('maps request-without-response to NetworkError', async () => {
    const error = { message: 'Network Error' };
    await expect(mockResponseErrorInterceptor(error)).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  it('maps 5xx responses to ServerError', async () => {
    const error = { response: { status: 500 } };
    await expect(mockResponseErrorInterceptor(error)).rejects.toBeInstanceOf(
      ServerError,
    );
  });

  it('maps 502 responses to ServerError', async () => {
    const error = { response: { status: 502 } };
    await expect(mockResponseErrorInterceptor(error)).rejects.toBeInstanceOf(
      ServerError,
    );
  });

  // --- R4: 401 Handling ---

  it('clears token storage and calls onLoggedOut on 401', async () => {
    const error = { response: { status: 401 } };
    await expect(mockResponseErrorInterceptor(error)).rejects.toBeInstanceOf(
      AuthError,
    );
    expect(mockTokenStorage.clear).toHaveBeenCalledTimes(1);
    expect(onLoggedOut).toHaveBeenCalledTimes(1);
  });

  it('removes the auth_token MMKV entry on 401', async () => {
    const mmkvState = new Map<string, string>();
    const mmkv = {
      getString: jest.fn((key: string) => mmkvState.get(key)),
      set: jest.fn((key: string, value: string) => {
        mmkvState.set(key, value);
      }),
      remove: jest.fn((key: string) => {
        mmkvState.delete(key);
      }),
    };
    const tokenStorage = new MmkvTokenStorage(mmkv);

    tokenStorage.set('persisted-jwt');
    expect(tokenStorage.get()).toBe('persisted-jwt');

    createApiClient('http://localhost:3000/api', tokenStorage, onLoggedOut);

    const error = { response: { status: 401 } };
    await expect(mockResponseErrorInterceptor(error)).rejects.toBeInstanceOf(
      AuthError,
    );

    expect(mmkv.getString('auth_token')).toBeUndefined();
    expect(mmkv.remove).toHaveBeenCalledWith('auth_token');
    expect(onLoggedOut).toHaveBeenCalledTimes(1);
  });

  // --- Pass-through ---

  it('rejects with original error for 4xx (non-401) responses', async () => {
    const originalError = { response: { status: 400, data: { message: 'Bad request' } } };
    await expect(mockResponseErrorInterceptor(originalError)).rejects.toBe(
      originalError,
    );
    expect(mockTokenStorage.clear).not.toHaveBeenCalled();
  });
});
