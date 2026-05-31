describe('alerts architecture boundaries', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('creates the alerts store with domain-only contracts even when data modules are blocked', async () => {
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(() => {
        try {
          jest.doMock('../src/data/alerts.api', () => {
            throw new Error('application layer must not import alerts.api');
          });

          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { createAlertsStore } = require('../src/application/alerts.store') as typeof import('../src/application/alerts.store');
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { AlertsRepository } = require('../src/domain/alerts.repository.port') as typeof import('../src/domain/alerts.repository.port');

          class InMemoryAlertsRepository extends AlertsRepository {
            async list() {
              return [
                {
                  id: 1,
                  userId: 7,
                  symbol: 'AAPL',
                  threshold: 180,
                  direction: 'above' as const,
                  active: true,
                  lastTriggeredAt: null,
                  createdAt: '2026-05-29T18:00:00.000Z',
                },
              ];
            }

            async create() {
              return {
                id: 99,
                userId: 7,
                symbol: 'MSFT',
                threshold: 400,
                direction: 'below' as const,
                active: true,
                lastTriggeredAt: null,
                createdAt: '2026-05-29T18:05:00.000Z',
              };
            }

            async delete() {
              return undefined;
            }
          }

          const store = createAlertsStore(new InMemoryAlertsRepository());

          store
            .getState()
            .load()
            .then(() => {
              expect(store.getState().items).toHaveLength(1);
              expect(store.getState().error).toBeNull();
              resolve();
            })
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    });
  });
});
