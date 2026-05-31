import type { AxiosInstance } from 'axios';
import type { AlertResponse, CreateAlertDTO } from '@designli-challenge/shared';
import { AlertsApi } from '../src/data/alerts.api';
import { AlertsCreateError, AlertsDeleteError, AlertsLoadError } from '../src/domain/alerts.errors';

describe('AlertsApi', () => {
  let client: Pick<AxiosInstance, 'get' | 'post' | 'delete'>;
  let alertsApi: AlertsApi;

  beforeEach(() => {
    client = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    };

    alertsApi = new AlertsApi(client as AxiosInstance);
  });

  it('gets AlertResponse[] from /alerts', async () => {
    const response: AlertResponse[] = [
      {
        id: 1,
        userId: 7,
        symbol: 'AAPL',
        threshold: 180,
        direction: 'above',
        active: true,
        lastTriggeredAt: null,
        createdAt: '2026-05-29T18:00:00.000Z',
      },
    ];

    (client.get as jest.Mock).mockResolvedValue({ data: response });

    await expect(alertsApi.list()).resolves.toEqual(response);
    expect(client.get).toHaveBeenCalledWith('/alerts');
  });

  it('sends Idempotency-Key when creating an alert', async () => {
    const dto: CreateAlertDTO = {
      symbol: 'MSFT',
      threshold: 400,
      direction: 'below',
    };
    const response: AlertResponse = {
      id: 2,
      userId: 7,
      ...dto,
      active: true,
      lastTriggeredAt: null,
      createdAt: '2026-05-29T18:05:00.000Z',
    };

    (client.post as jest.Mock).mockResolvedValue({ data: response });

    await expect(alertsApi.create(dto, 'idempotency-123')).resolves.toEqual(response);
    expect(client.post).toHaveBeenCalledWith('/alerts', dto, {
      headers: {
        'Idempotency-Key': 'idempotency-123',
      },
    });
  });

  it('deletes from /alerts/:id', async () => {
    (client.delete as jest.Mock).mockResolvedValue(undefined);

    await expect(alertsApi.delete(9)).resolves.toBeUndefined();
    expect(client.delete).toHaveBeenCalledWith('/alerts/9');
  });

  it('wraps list failures as AlertsLoadError', async () => {
    (client.get as jest.Mock).mockRejectedValue(new Error('Server error: 500'));

    await expect(alertsApi.list()).rejects.toEqual(
      expect.objectContaining({
        message: 'Server error: 500',
        name: 'AlertsLoadError',
      }),
    );
  });

  it('preserves an existing AlertsCreateError', async () => {
    const error = new AlertsCreateError('Duplicate request');
    (client.post as jest.Mock).mockRejectedValue(error);

    await expect(alertsApi.create({ symbol: 'AAPL', threshold: 100, direction: 'above' }, 'key')).rejects.toBe(error);
  });

  it('preserves an existing AlertsDeleteError', async () => {
    const error = new AlertsDeleteError('Alert not found');
    (client.delete as jest.Mock).mockRejectedValue(error);

    await expect(alertsApi.delete(3)).rejects.toBe(error);
  });

  it('preserves an existing AlertsLoadError', async () => {
    const error = new AlertsLoadError('Unauthorized');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(alertsApi.list()).rejects.toBe(error);
  });
});
