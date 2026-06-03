import { createStorage } from './mmkv';
import { MmkvTokenStorage } from './token-storage.mmkv';
import { MmkvStockSnapshotStorage } from './stock-snapshot.mmkv';
import { AuthApi } from './auth.api';
import { AlertsApi } from './alerts.api';
import { NotificationsApi } from './notifications.api';
import { StocksApi } from './stocks.api';
import { createAlertsStore } from '../application/alerts.store';
import { createAuthStore } from '../application/auth.store';
import { createNotificationsStore } from '../application/notifications.store';
import { createStocksStore } from '../application/stocks.store';
import { useInboxStore } from '../application/inbox.store';
import { ExpoPushRuntime } from './expo-push.runtime';
import { setOnUnauthorizedCallback } from './apiFetch';

/**
 * Manual composition root.
 * No DI framework — just wiring order:
 *   1. MMKV instance (sync native storage)
 *   2. TokenStorage wrapper
 *   3. API implementations using native fetch
 *   4. Zustand stores (factories)
 *   5. Close the loop: wire 401 logout callback
 */

const mmkv = createStorage();
const tokenStorage = new MmkvTokenStorage(mmkv);
const stockSnapshotStorage = new MmkvStockSnapshotStorage(mmkv);

// Placeholder — replaced after store creation so 401 handler can
// call store.getState().logout() without a circular dependency.
let doLogout: () => void = () => {
  tokenStorage.clear();
};

const authRepo = new AuthApi();
const alertsRepo = new AlertsApi(tokenStorage);
const notificationsRepo = new NotificationsApi(tokenStorage);
const stocksRepo = new StocksApi(tokenStorage);
const pushRuntime = new ExpoPushRuntime();
const useAuthStore = createAuthStore(authRepo, tokenStorage);
const useAlertsStore = createAlertsStore(alertsRepo);
const useNotificationsStore = createNotificationsStore(notificationsRepo, pushRuntime);
const useStocksStore = createStocksStore(stocksRepo, stockSnapshotStorage);

// Close the loop: 401-triggered logout now calls the real store action
doLogout = () => useAuthStore.getState().logout();
setOnUnauthorizedCallback(() => doLogout());

export {
  useAuthStore,
  useAlertsStore,
  useNotificationsStore,
  useStocksStore,
  useInboxStore,
  tokenStorage,
};
