import { create } from 'zustand';
import type { NotificationsRepository } from '../domain/notifications.repository.port';
import type { NotificationPermissionStatus, PushRuntimePort } from '../domain/push-runtime.port';
import {
  NotificationsPermissionError,
  NotificationsRegistrationError,
  NotificationsTokenError,
} from '../domain/notifications.errors';

export interface NotificationsState {
  permissionStatus: NotificationPermissionStatus;
  isSupported: boolean;
  tokenStatus: 'idle' | 'registering' | 'registered' | 'error';
  isChecking: boolean;
  isRegistering: boolean;
  lastRegisteredAt: string | null;
  error: string | null;
  refreshStatus: () => Promise<void>;
  requestPermissionAndRegister: () => Promise<boolean>;
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
    lastRegisteredAt: null,
    error: null,

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
          });
          return;
        }

        const permissionStatus = await pushRuntime.getPermissionStatus();
        set({
          isSupported: true,
          permissionStatus,
          isChecking: false,
          error: null,
        });
      } catch (error) {
        const permissionError = NotificationsPermissionError.fromUnknown(error);
        set({
          isSupported: true,
          permissionStatus: 'denied',
          tokenStatus: 'error',
          isChecking: false,
          error: permissionError.message,
        });
      }
    },

    requestPermissionAndRegister: async () => {
      if (get().isRegistering) {
        return false;
      }

      set({ isRegistering: true, tokenStatus: 'registering', error: null });

      try {
        const supported = get().permissionStatus === 'unsupported'
          ? false
          : await pushRuntime.isSupported();

        if (!supported) {
          set({
            isSupported: false,
            permissionStatus: 'unsupported',
            tokenStatus: 'idle',
            isRegistering: false,
          });
          return false;
        }

        const currentPermission = get().permissionStatus === 'granted'
          ? 'granted'
          : await pushRuntime.requestPermission();

        if (currentPermission !== 'granted') {
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

        set({
          isSupported: true,
          permissionStatus: 'granted',
          tokenStatus: 'registered',
          isRegistering: false,
          lastRegisteredAt: new Date().toISOString(),
          error: null,
        });

        return true;
      } catch (error) {
        const registrationError = error instanceof NotificationsTokenError
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
  }));
}
