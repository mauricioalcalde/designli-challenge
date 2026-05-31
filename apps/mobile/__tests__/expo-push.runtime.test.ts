import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ExpoPushRuntime } from '../src/data/expo-push.runtime';
import {
  NotificationsPermissionError,
  NotificationsTokenError,
} from '../src/domain/notifications.errors';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
}));

describe('ExpoPushRuntime', () => {
  const runtime = new ExpoPushRuntime();
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as { OS: string }).OS = 'android';
  });

  afterAll(() => {
    (Platform as { OS: string }).OS = originalPlatform;
  });

  it('reports unsupported outside native iOS or Android runtimes', async () => {
    (Platform as { OS: string }).OS = 'web';

    await expect(runtime.isSupported()).resolves.toBe(false);
    await expect(runtime.getPermissionStatus()).rejects.toBeInstanceOf(NotificationsPermissionError);
  });

  it('maps granted permissions from expo-notifications', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as never);

    await expect(runtime.getPermissionStatus()).resolves.toBe('granted');
  });

  it('maps denied permission requests from expo-notifications', async () => {
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ granted: false } as never);

    await expect(runtime.requestPermission()).resolves.toBe('denied');
  });

  it('returns the native device token with the active platform', async () => {
    (Platform as { OS: string }).OS = 'ios';
    jest.mocked(Notifications.getDevicePushTokenAsync).mockResolvedValue({ data: 'native-token-123' } as never);

    await expect(runtime.getDeviceToken()).resolves.toEqual({
      token: 'native-token-123',
      platform: 'ios',
    });
  });

  it('maps Expo Go and simulator runtime failures to a readiness message', async () => {
    jest.mocked(Notifications.getDevicePushTokenAsync).mockRejectedValue(
      new Error('getDevicePushTokenAsync is not supported in Expo Go on a simulator'),
    );

    await expect(runtime.getDeviceToken()).rejects.toEqual(
      expect.objectContaining<Partial<NotificationsTokenError>>({
        message: 'Push notifications require a development build on a physical device',
      }),
    );
  });
});
