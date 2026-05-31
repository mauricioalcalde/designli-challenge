import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  NotificationsPermissionError,
  NotificationsTokenError,
} from '../domain/notifications.errors';
import type { NativeDeviceToken, NativePushPlatform } from '../domain/push-runtime.port';
import { PushRuntimePort } from '../domain/push-runtime.port';

const SUPPORTED_PLATFORMS: NativePushPlatform[] = ['ios', 'android'];

export class ExpoPushRuntime extends PushRuntimePort {
  async isSupported(): Promise<boolean> {
    return SUPPORTED_PLATFORMS.includes(Platform.OS as NativePushPlatform);
  }

  async getPermissionStatus(): Promise<'unknown' | 'denied' | 'granted'> {
    this.assertSupportedForPermissions();

    try {
      const settings = await Notifications.getPermissionsAsync();
      return settings.granted ? 'granted' : 'denied';
    } catch (error) {
      throw NotificationsPermissionError.fromUnknown(error);
    }
  }

  async requestPermission(): Promise<'denied' | 'granted'> {
    this.assertSupportedForPermissions();

    try {
      const settings = await Notifications.requestPermissionsAsync();
      return settings.granted ? 'granted' : 'denied';
    } catch (error) {
      throw NotificationsPermissionError.fromUnknown(error);
    }
  }

  async getDeviceToken(): Promise<NativeDeviceToken> {
    const platform = this.getNativePlatform();

    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      const token = typeof deviceToken.data === 'string' ? deviceToken.data.trim() : '';

      if (!token) {
        throw new NotificationsTokenError('Native push token was empty');
      }

      return { token, platform };
    } catch (error) {
      throw new NotificationsTokenError(this.getTokenErrorMessage(error));
    }
  }

  private assertSupportedForPermissions(): void {
    if (!SUPPORTED_PLATFORMS.includes(Platform.OS as NativePushPlatform)) {
      throw new NotificationsPermissionError('Push notifications require a native iOS or Android runtime');
    }
  }

  private getNativePlatform(): NativePushPlatform {
    if (SUPPORTED_PLATFORMS.includes(Platform.OS as NativePushPlatform)) {
      return Platform.OS as NativePushPlatform;
    }

    throw new NotificationsTokenError('Push notifications require a native iOS or Android runtime');
  }

  private getTokenErrorMessage(error: unknown): string {
    if (error instanceof NotificationsTokenError) {
      return error.message;
    }

    const message = error instanceof Error && error.message
      ? error.message
      : 'Unable to get a device token right now';
    const normalized = message.toLowerCase();

    if (
      normalized.includes('expo go')
      || normalized.includes('development build')
      || normalized.includes('physical device')
      || normalized.includes('simulator')
      || normalized.includes('emulator')
    ) {
      return 'Push notifications require a development build on a physical device';
    }

    return message;
  }
}
