import { createNotificationsStore } from '../src/application/notifications.store';
import type { NotificationsRepository } from '../src/domain/notifications.repository.port';
import type { PushRuntimePort } from '../src/domain/push-runtime.port';
import {
  NotificationsPermissionError,
  NotificationsRegistrationError,
  NotificationsTokenError,
} from '../src/domain/notifications.errors';

describe('notifications.store', () => {
  let mockNotificationsRepo: jest.Mocked<NotificationsRepository>;
  let mockPushRuntime: jest.Mocked<PushRuntimePort>;
  let useNotificationsStore: ReturnType<typeof createNotificationsStore>;

  beforeEach(() => {
    mockNotificationsRepo = {
      registerDeviceToken: jest.fn(),
    } as unknown as jest.Mocked<NotificationsRepository>;

    mockPushRuntime = {
      isSupported: jest.fn(),
      getPermissionStatus: jest.fn(),
      requestPermission: jest.fn(),
      getDeviceToken: jest.fn(),
    } as unknown as jest.Mocked<PushRuntimePort>;

    useNotificationsStore = createNotificationsStore(mockNotificationsRepo, mockPushRuntime);
  });

  it('marks the shell as unsupported when the runtime is unavailable', async () => {
    mockPushRuntime.isSupported.mockResolvedValue(false);

    await useNotificationsStore.getState().refreshStatus();

    expect(useNotificationsStore.getState().permissionStatus).toBe('unsupported');
    expect(useNotificationsStore.getState().isSupported).toBe(false);
    expect(useNotificationsStore.getState().error).toBeNull();
  });

  it('stores granted permission after refresh success', async () => {
    mockPushRuntime.isSupported.mockResolvedValue(true);
    mockPushRuntime.getPermissionStatus.mockResolvedValue('granted');

    await useNotificationsStore.getState().refreshStatus();

    expect(useNotificationsStore.getState().permissionStatus).toBe('granted');
    expect(useNotificationsStore.getState().isChecking).toBe(false);
  });

  it('stores a retryable permission error when refresh fails', async () => {
    mockPushRuntime.isSupported.mockRejectedValue(new NotificationsPermissionError('Permission lookup failed'));

    await useNotificationsStore.getState().refreshStatus();

    expect(useNotificationsStore.getState().permissionStatus).toBe('denied');
    expect(useNotificationsStore.getState().tokenStatus).toBe('error');
    expect(useNotificationsStore.getState().error).toBe('Permission lookup failed');
  });

  it('registers a device token after permission is granted', async () => {
    mockPushRuntime.isSupported.mockResolvedValue(true);
    mockPushRuntime.requestPermission.mockResolvedValue('granted');
    mockPushRuntime.getDeviceToken.mockResolvedValue({ token: 'native-token-123', platform: 'android' });
    mockNotificationsRepo.registerDeviceToken.mockResolvedValue(undefined);

    const action = useNotificationsStore.getState().requestPermissionAndRegister();

    expect(useNotificationsStore.getState().isRegistering).toBe(true);

    await action;

    expect(mockNotificationsRepo.registerDeviceToken).toHaveBeenCalledWith({
      token: 'native-token-123',
      platform: 'android',
    });
    expect(useNotificationsStore.getState().permissionStatus).toBe('granted');
    expect(useNotificationsStore.getState().tokenStatus).toBe('registered');
    expect(useNotificationsStore.getState().lastRegisteredAt).not.toBeNull();
  });

  it('does not call the backend when permission stays denied', async () => {
    mockPushRuntime.isSupported.mockResolvedValue(true);
    mockPushRuntime.requestPermission.mockResolvedValue('denied');

    await useNotificationsStore.getState().requestPermissionAndRegister();

    expect(mockPushRuntime.getDeviceToken).not.toHaveBeenCalled();
    expect(mockNotificationsRepo.registerDeviceToken).not.toHaveBeenCalled();
    expect(useNotificationsStore.getState().permissionStatus).toBe('denied');
    expect(useNotificationsStore.getState().tokenStatus).toBe('idle');
  });

  it('stores a token error when native token retrieval fails', async () => {
    mockPushRuntime.isSupported.mockResolvedValue(true);
    mockPushRuntime.requestPermission.mockResolvedValue('granted');
    mockPushRuntime.getDeviceToken.mockRejectedValue(new NotificationsTokenError('Native token failed'));

    await useNotificationsStore.getState().requestPermissionAndRegister();

    expect(useNotificationsStore.getState().tokenStatus).toBe('error');
    expect(useNotificationsStore.getState().error).toBe('Native token failed');
  });

  it('stores a backend failure and leaves success unset when registration fails', async () => {
    mockPushRuntime.isSupported.mockResolvedValue(true);
    mockPushRuntime.requestPermission.mockResolvedValue('granted');
    mockPushRuntime.getDeviceToken.mockResolvedValue({ token: 'native-token-123', platform: 'ios' });
    mockNotificationsRepo.registerDeviceToken.mockRejectedValue(
      new NotificationsRegistrationError('Unauthorized'),
    );

    await useNotificationsStore.getState().requestPermissionAndRegister();

    expect(useNotificationsStore.getState().tokenStatus).toBe('error');
    expect(useNotificationsStore.getState().error).toBe('Unauthorized');
    expect(useNotificationsStore.getState().lastRegisteredAt).toBeNull();
  });

  it('ignores a second registration request while one is already running', async () => {
    let resolvePermission: ((value: 'denied' | 'granted') => void) | undefined;
    let resolveRegister: (() => void) | undefined;

    mockPushRuntime.isSupported.mockResolvedValue(true);
    mockPushRuntime.requestPermission.mockImplementation(
      () =>
        new Promise<'denied' | 'granted'>((resolve) => {
          resolvePermission = resolve;
        }),
    );
    mockPushRuntime.getDeviceToken.mockResolvedValue({ token: 'native-token-123', platform: 'android' });
    mockNotificationsRepo.registerDeviceToken.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRegister = resolve;
        }),
    );

    const firstRequest = useNotificationsStore.getState().requestPermissionAndRegister();
    const secondRequest = useNotificationsStore.getState().requestPermissionAndRegister();

    await Promise.resolve();

    expect(mockPushRuntime.requestPermission).toHaveBeenCalledTimes(1);
    expect(mockNotificationsRepo.registerDeviceToken).not.toHaveBeenCalled();

    resolvePermission?.('granted');
    await Promise.resolve();
    await Promise.resolve();
    resolveRegister?.();

    await firstRequest;
    await secondRequest;

    expect(mockNotificationsRepo.registerDeviceToken).toHaveBeenCalledTimes(1);
  });
});
