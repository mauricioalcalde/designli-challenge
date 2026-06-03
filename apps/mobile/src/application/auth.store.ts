import { create } from 'zustand';
import type { AuthRepository } from '../domain/auth.repository.port';
import type { TokenStorage } from '../domain/token-storage.port';
import { API_BASE_URL } from '../data/env';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  bootstrap: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

/**
 * Zustand auth store factory.
 * Depends on AuthRepository (data layer) and TokenStorage (sync MMKV).
 * The 401 interceptor in api-client calls `onLoggedOut`,
 * which container wires to `store.getState().logout()`.
 */
export function createAuthStore(authRepo: AuthRepository, tokenStorage: TokenStorage) {
  return create<AuthState>()((set) => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,

    /**
     * Synchronous bootstrap — TokenStorage.get() is a sync MMKV read.
     * Called once on cold start to restore auth state.
     */
    bootstrap: () => {
      const token = tokenStorage.get();
      set({ isAuthenticated: token !== null });
    },

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authRepo.login({ email, password });
        tokenStorage.set(response.token);
        set({ isAuthenticated: true, isLoading: false });
      } catch (err: any) {
        console.log('[AUTH_ERROR]', {
          baseURL: API_BASE_URL,
          message: err?.message,
          code: err?.code,
          status: err?.response?.status,
          data: err?.response?.data,
        });
        const message = err instanceof Error ? err.message : 'Login failed';
        set({ error: message, isLoading: false });
      }
    },

    register: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authRepo.register({ email, password });
        tokenStorage.set(response.token);
        set({ isAuthenticated: true, isLoading: false });
      } catch (err: any) {
        console.log('[AUTH_ERROR]', {
          baseURL: API_BASE_URL,
          message: err?.message,
          code: err?.code,
          status: err?.response?.status,
          data: err?.response?.data,
        });
        const message = err instanceof Error ? err.message : 'Registration failed';
        set({ error: message, isLoading: false });
      }
    },

    logout: () => {
      tokenStorage.clear();
      set({ isAuthenticated: false, isLoading: false, error: null });
    },
  }));
}
