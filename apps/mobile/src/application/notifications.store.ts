import { create } from 'zustand';
import type { NotificationsRepository } from '../domain/notifications.repository.port';
import type { NotificationPermissionStatus, PushRuntimePort } from '../domain/push-runtime.port';
import {
  NotificationsPermissionError,
  NotificationsRegistrationError,
  NotificationsTokenError,
} from '../domain/notifications.errors';
import {
  getLastRegisteredAt,
  getNotificationsPromptShown,
  setLastPermissionStatus,
  setLastRegisteredAt,
  setNotificationsPromptShown,
} from '../data/notifications.local';

function maskToken(token: string): string {
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export interface NotificationsState {
  permissionStatus: NotificationPermissionStatus;
  isSupported: boolean;
  tokenStatus: 'idle' | 'registering' | 'registered' | 'error';
  isChecking: boolean;
  isRegistering: boolean;
  lastRegisteredAt: string | null;
  platform: 'ios' | 'android' | null;
  tokenPreview: string | null;
  error: string | null;
  hasPromptedOnboarding: boolean;
  refreshStatus: () => Promise<void>;
  requestPermissionAndRegister: () => Promise<boolean>;
  maybePromptAfterLogin: () => Promise<void>;
  ensureTokenRegistered: () => Promise<void>;
  openSystemSettings: () => Promise<void>;
}

export function createNotificationsStore(
  notificationsRepo: NotificationsRepository,
  pushRuntime: PushRuntimePort,
) {
  return create<NotificationsState>()((set, get) => ({
    permissionStatus: 'unknown',
    isSupported: true,
    tokenStatus: 'idle',
    isChecking: false,
    isRegistering: false,
    lastRegisteredAt: getLastRegisteredAt(),
    platform: null,
    tokenPreview: null,
    error: null,
    hasPromptedOnboarding: getNotificationsPromptShown(),

    refreshStatus: async () => {
      set({ isChecking: true, error: null });

      try {
        const supported = await pushRuntime.isSupported();

        if (!supported) {
          set({
            isSupported: false,
            permissionStatus: 'unsupported',
            tokenStatus: 'idle',
            isChecking: false,
            error: null,
            platform: null,
            tokenPreview: null,
          });
          return;
        }

        const permissionStatus = await pushRuntime.getPermissionStatus();
        setLastPermissionStatus(permissionStatus);
        const deviceStatus = await notificationsRepo.getDeviceStatus().catch(() => null);
        set({
          isSupported: true,
          permissionStatus,
          tokenStatus: deviceStatus?.registered ? 'registered' : 'idle',
          isChecking: false,
          error: null,
          lastRegisteredAt: deviceStatus?.lastRegisteredAt ?? getLastRegisteredAt(),
          platform: deviceStatus?.platform ?? null,
          tokenPreview: deviceStatus?.tokenPreview ?? null,
        });
      } catch (error) {
        const permissionError = NotificationsPermissionError.fromUnknown(error);
        set({
          isSupported: true,
          permissionStatus: 'denied',
          tokenStatus: 'error',
          isChecking: false,
          error: permissionError.message,
          platform: null,
          tokenPreview: null,
        });
      }
    },

    requestPermissionAndRegister: async () => {
      if (get().isRegistering) {
        return false;
      }

      set({ isRegistering: true, tokenStatus: 'registering', error: null });

      try {
        const supported =
          get().permissionStatus === 'unsupported' ? false : await pushRuntime.isSupported();

        if (!supported) {
          set({
            isSupported: false,
            permissionStatus: 'unsupported',
            tokenStatus: 'idle',
            isRegistering: false,
          });
          return false;
        }

        const currentPermission =
          get().permissionStatus === 'granted' ? 'granted' : await pushRuntime.requestPermission();

        if (currentPermission !== 'granted') {
          setLastPermissionStatus('denied');
          set({
            isSupported: true,
            permissionStatus: 'denied',
            tokenStatus: 'idle',
            isRegistering: false,
          });
          return false;
        }

        const deviceToken = await pushRuntime.getDeviceToken();
        await notificationsRepo.registerDeviceToken(deviceToken);
        const now = new Date().toISOString();
        setLastRegisteredAt(now);
        setLastPermissionStatus('granted');
        setNotificationsPromptShown(true);

        set({
          isSupported: true,
          permissionStatus: 'granted',
          tokenStatus: 'registered',
          isRegistering: false,
          lastRegisteredAt: now,
          platform: deviceToken.platform,
          tokenPreview: maskToken(deviceToken.token),
          error: null,
          hasPromptedOnboarding: true,
        });

        return true;
      } catch (error) {
        const registrationError =
          error instanceof NotificationsTokenError
            ? NotificationsTokenError.fromUnknown(error)
            : NotificationsRegistrationError.fromUnknown(error);

        set({
          tokenStatus: 'error',
          isRegistering: false,
          error: registrationError.message,
        });

        return false;
      }
    },

    maybePromptAfterLogin: async () => {
      const state = get();
      if (state.hasPromptedOnboarding) {
        // Already prompted, but ensure token is re-registered in case FCM token rotated
        await get().ensureTokenRegistered();
        return;
      }

      const supported = await pushRuntime.isSupported();
      if (!supported) {
        setNotificationsPromptShown(true);
        set({ hasPromptedOnboarding: true, isSupported: false, permissionStatus: 'unsupported' });
        return;
      }

      const status = await pushRuntime.getPermissionStatus();
      setLastPermissionStatus(status);

      if (status === 'granted') {
        setNotificationsPromptShown(true);
        set({ hasPromptedOnboarding: true });
        await get().requestPermissionAndRegister();
        return;
      }

      setNotificationsPromptShown(true);
      set({ hasPromptedOnboarding: true });
      await get().requestPermissionAndRegister();
    },

    ensureTokenRegistered: async () => {
      // Re-register token if permission is already granted (handles FCM token rotation)
      const state = get();
      if (state.isRegistering) return;

      try {
        const supported = await pushRuntime.isSupported();
        if (!supported) return;

        const status = await pushRuntime.getPermissionStatus();
        if (status !== 'granted') return;

        // Permission already granted, just re-register the token
        const deviceToken = await pushRuntime.getDeviceToken();
        await notificationsRepo.registerDeviceToken(deviceToken);
        const now = new Date().toISOString();
        setLastRegisteredAt(now);
        setLastPermissionStatus('granted');

        set({
          tokenStatus: 'registered',
          lastRegisteredAt: now,
          platform: deviceToken.platform,
          tokenPreview: maskToken(deviceToken.token),
          error: null,
        });
      } catch (error) {
        // Silent fail - don't disrupt user flow if re-registration fails
        console.warn('[NotificationsStore] Token re-registration failed:', error);
      }
    },

    openSystemSettings: async () => {
      await pushRuntime.openSystemSettings();
    },
  }));
}
