import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { TokenStorage } from '../domain/token-storage.port';
import { NetworkError, AuthError, ServerError } from '../domain/auth-errors';

/**
 * Creates a pre-configured Axios instance with:
 * - Token injection via request interceptor
 * - 401 → clear token + emit logout
 * - Typed error mapping (NetworkError | AuthError | ServerError)
 */
export function createApiClient(
  baseURL: string,
  tokenStorage: TokenStorage,
  onLoggedOut: () => void,
): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 10000 });

  // Request interceptor: inject Bearer token from sync storage
  client.interceptors.request.use((config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: error mapping + 401 handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (!error.response) {
        // No response received → network issue
        return Promise.reject(new NetworkError(error.message));
      }

      const { status } = error.response;

      if (status === 401) {
        tokenStorage.clear();
        onLoggedOut();
        return Promise.reject(new AuthError('Unauthorized'));
      }

      if (status >= 500) {
        return Promise.reject(new ServerError(`Server error: ${status}`));
      }

      // Other client errors (400, 403, 404 etc.) — pass through as-is
      return Promise.reject(error);
    },
  );

  return client;
}
