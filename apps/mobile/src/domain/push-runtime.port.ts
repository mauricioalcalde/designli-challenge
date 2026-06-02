export type NotificationPermissionStatus = 'unsupported' | 'unknown' | 'denied' | 'granted';
export type NativePushPlatform = 'ios' | 'android';

export interface NativeDeviceToken {
  token: string;
  platform: NativePushPlatform;
}

/**
 * Abstract boundary for native push support, permissions, and token retrieval.
 */
export abstract class PushRuntimePort {
  abstract isSupported(): Promise<boolean>;
  abstract getPermissionStatus(): Promise<'unknown' | 'denied' | 'granted'>;
  abstract requestPermission(): Promise<'denied' | 'granted'>;
  abstract getDeviceToken(): Promise<NativeDeviceToken>;
  abstract openSystemSettings(): Promise<void>;
}
