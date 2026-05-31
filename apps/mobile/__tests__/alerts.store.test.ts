import type { AlertResponse } from '@designli-challenge/shared';
import { createAlertsStore } from '../src/application/alerts.store';
import type { AlertsRepository } from '../src/domain/alerts.repository.port';
import { AlertsCreateError, AlertsDeleteError, AlertsLoadError } from '../src/domain/alerts.errors';

jest.mock('../src/data/idempotency-key', () => ({
  createIdempotencyKey: jest.fn(() => 'generated-idempotency-key'),
}));

describe('alerts.store', () => {
  let mockAlertsRepo: jest.Mocked<AlertsRepository>;
  let useAlertsStore: ReturnType<typeof createAlertsStore>;

  const alerts: AlertResponse[] = [
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
    {
      id: 2,
      userId: 7,
      symbol: 'MSFT',
      threshold: 400,
      direction: 'below',
      active: true,
      lastTriggeredAt: null,
      createdAt: '2026-05-29T18:05:00.000Z',
    },
  ];

  beforeEach(() => {
    mockAlertsRepo = {
      list: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AlertsRepository>;

    useAlertsStore = createAlertsStore(mockAlertsRepo);
  });

  it('loads alerts into state on success', async () => {
    mockAlertsRepo.list.mockResolvedValue(alerts);

    await useAlertsStore.getState().load();

    expect(useAlertsStore.getState().items).toEqual(alerts);
    expect(useAlertsStore.getState().isLoading).toBe(false);
    expect(useAlertsStore.getState().error).toBeNull();
  });

  it('supports explicit empty state responses', async () => {
    mockAlertsRepo.list.mockResolvedValue([]);

    await useAlertsStore.getState().load();

    expect(useAlertsStore.getState().items).toEqual([]);
    expect(useAlertsStore.getState().error).toBeNull();
  });

  it('stores a retryable error when loading fails', async () => {
    mockAlertsRepo.list.mockRejectedValue(new AlertsLoadError('No internet connection'));

    await useAlertsStore.getState().load();

    expect(useAlertsStore.getState().items).toEqual([]);
    expect(useAlertsStore.getState().isLoading).toBe(false);
    expect(useAlertsStore.getState().error).toBe('No internet connection');
  });

  it('removes only the target alert after delete success', async () => {
    mockAlertsRepo.list.mockResolvedValue(alerts);
    mockAlertsRepo.delete.mockResolvedValue(undefined);
    await useAlertsStore.getState().load();

    const action = useAlertsStore.getState().remove(1);

    expect(useAlertsStore.getState().deletingIds).toEqual([1]);

    await action;

    expect(useAlertsStore.getState().items).toEqual([alerts[1]]);
    expect(useAlertsStore.getState().deletingIds).toEqual([]);
    expect(useAlertsStore.getState().deleteErrors).toEqual({});
  });

  it('keeps the row visible and records a row-scoped error when delete fails', async () => {
    mockAlertsRepo.list.mockResolvedValue(alerts);
    mockAlertsRepo.delete.mockRejectedValue(new AlertsDeleteError('Alert not found'));
    await useAlertsStore.getState().load();

    await useAlertsStore.getState().remove(2);

    expect(useAlertsStore.getState().items).toEqual(alerts);
    expect(useAlertsStore.getState().deletingIds).toEqual([]);
    expect(useAlertsStore.getState().deleteErrors).toEqual({ 2: 'Alert not found' });
  });

  it('creates an alert with one generated idempotency key and prepends the result', async () => {
    const createdAlert: AlertResponse = {
      id: 3,
      userId: 7,
      symbol: 'NVDA',
      threshold: 950,
      direction: 'above',
      active: true,
      lastTriggeredAt: null,
      createdAt: '2026-05-29T18:10:00.000Z',
    };

    mockAlertsRepo.list.mockResolvedValue(alerts);
    mockAlertsRepo.create.mockResolvedValue(createdAlert);
    await useAlertsStore.getState().load();

    const action = useAlertsStore.getState().create({
      symbol: ' nvda ',
      threshold: '950',
      direction: 'above',
    });

    expect(useAlertsStore.getState().isSubmitting).toBe(true);

    await action;

    expect(mockAlertsRepo.create).toHaveBeenCalledWith(
      { symbol: 'NVDA', threshold: 950, direction: 'above' },
      'generated-idempotency-key',
    );
    expect(useAlertsStore.getState().items).toEqual([createdAlert, ...alerts]);
    expect(useAlertsStore.getState().isSubmitting).toBe(false);
    expect(useAlertsStore.getState().submitError).toBeNull();
  });

  it('does not append a duplicate row when the create response returns an existing alert id', async () => {
    const duplicateAlert: AlertResponse = {
      ...alerts[0],
      threshold: 185,
    };

    mockAlertsRepo.list.mockResolvedValue(alerts);
    mockAlertsRepo.create.mockResolvedValue(duplicateAlert);
    await useAlertsStore.getState().load();

    await useAlertsStore.getState().create({
      symbol: 'AAPL',
      threshold: '185',
      direction: 'above',
    });

    expect(useAlertsStore.getState().items).toEqual([duplicateAlert, alerts[1]]);
  });

  it('stores a submit error and leaves the list untouched when create fails', async () => {
    mockAlertsRepo.list.mockResolvedValue(alerts);
    mockAlertsRepo.create.mockRejectedValue(new AlertsCreateError('Duplicate request'));
    await useAlertsStore.getState().load();

    await useAlertsStore.getState().create({
      symbol: 'AAPL',
      threshold: '180',
      direction: 'above',
    });

    expect(useAlertsStore.getState().items).toEqual(alerts);
    expect(useAlertsStore.getState().isSubmitting).toBe(false);
    expect(useAlertsStore.getState().submitError).toBe('Duplicate request');
  });

  it('ignores a second create request while one is already in flight', async () => {
    let resolveCreate: ((value: AlertResponse) => void) | undefined;

    mockAlertsRepo.create.mockImplementation(
      () =>
        new Promise<AlertResponse>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const firstCreate = useAlertsStore.getState().create({
      symbol: 'AAPL',
      threshold: '180',
      direction: 'above',
    });

    const secondCreate = useAlertsStore.getState().create({
      symbol: 'AAPL',
      threshold: '180',
      direction: 'above',
    });

    expect(mockAlertsRepo.create).toHaveBeenCalledTimes(1);

    resolveCreate?.({
      id: 4,
      userId: 7,
      symbol: 'AAPL',
      threshold: 180,
      direction: 'above',
      active: true,
      lastTriggeredAt: null,
      createdAt: '2026-05-29T18:20:00.000Z',
    });

    await firstCreate;
    await secondCreate;
  });
});
