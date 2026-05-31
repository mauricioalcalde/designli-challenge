import type { AxiosInstance } from 'axios';
import { NotificationsApi } from '../src/data/notifications.api';
import { NotificationsRegistrationError } from '../src/domain/notifications.errors';

describe('NotificationsApi', () => {
  let client: Pick<AxiosInstance, 'post'>;
  let notificationsApi: NotificationsApi;

  beforeEach(() => {
    client = {
      post: jest.fn(),
    };

    notificationsApi = new NotificationsApi(client as AxiosInstance);
  });

  it('posts the device token payload to /devices/token', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: { status: 'ok' } });

    await expect(
      notificationsApi.registerDeviceToken({ token: 'native-token-123', platform: 'android' }),
    ).resolves.toBeUndefined();

    expect(client.post).toHaveBeenCalledWith('/devices/token', {
      token: 'native-token-123',
      platform: 'android',
    });
  });

  it('treats an already-known token response as success', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: { status: 'ok' } });

    await expect(
      notificationsApi.registerDeviceToken({ token: 'duplicate-token', platform: 'ios' }),
    ).resolves.toBeUndefined();
  });

  it('preserves an existing NotificationsRegistrationError', async () => {
    const error = new NotificationsRegistrationError('Unauthorized');
    (client.post as jest.Mock).mockRejectedValue(error);

    await expect(
      notificationsApi.registerDeviceToken({ token: 'native-token-123', platform: 'android' }),
    ).rejects.toBe(error);
  });

  it('wraps unknown backend failures as NotificationsRegistrationError', async () => {
    (client.post as jest.Mock).mockRejectedValue(new Error('Server error: 500'));

    await expect(
      notificationsApi.registerDeviceToken({ token: 'native-token-123', platform: 'android' }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'NotificationsRegistrationError',
        message: 'Server error: 500',
      }),
    );
  });
});
