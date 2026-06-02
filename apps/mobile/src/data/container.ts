import { createStorage } from './mmkv';
import { MmkvTokenStorage } from './token-storage.mmkv';
import { MmkvStockSnapshotStorage } from './stock-snapshot.mmkv';
import { createApiClient } from './api-client';
import { AuthApi } from './auth.api';
import { AlertsApi } from './alerts.api';
import { NotificationsApi } from './notifications.api';
import { StocksApi } from './stocks.api';
import { createAlertsStore } from '../application/alerts.store';
import { createAuthStore } from '../application/auth.store';
import { createNotificationsStore } from '../application/notifications.store';
import { createStocksStore } from '../application/stocks.store';
import { ExpoPushRuntime } from './expo-push.runtime';
import { API_BASE_URL } from './env';

/**
 * Manual composition root.
 * No DI framework — just wiring order:
 *   1. MMKV instance (sync native storage)
 *   2. TokenStorage wrapper
 *   3. Axios client with token injection + 401→logout interceptor
 *   4. AuthRepository impl (HTTP)
 *   5. Zustand auth store (factory)
 *   6. Close the loop: wire 401 logout callback to store.logout()
 */

const mmkv = createStorage();
const tokenStorage = new MmkvTokenStorage(mmkv);
const stockSnapshotStorage = new MmkvStockSnapshotStorage(mmkv);

// Placeholder — replaced after store creation so 401 interceptor can
// call store.getState().logout() without a circular dependency.
let doLogout: () => void = () => {
  tokenStorage.clear();
};

const apiClient = createApiClient(API_BASE_URL, tokenStorage, () => doLogout());
const authRepo = new AuthApi(apiClient);
const alertsRepo = new AlertsApi(apiClient);
const notificationsRepo = new NotificationsApi(apiClient);
const stocksRepo = new StocksApi(apiClient);
const pushRuntime = new ExpoPushRuntime();
const useAuthStore = createAuthStore(authRepo, tokenStorage);
const useAlertsStore = createAlertsStore(alertsRepo);
const useNotificationsStore = createNotificationsStore(notificationsRepo, pushRuntime);
const useStocksStore = createStocksStore(stocksRepo, stockSnapshotStorage);

// Close the loop: 401-triggered logout now calls the real store action
doLogout = () => useAuthStore.getState().logout();

export { useAuthStore, useAlertsStore, useNotificationsStore, useStocksStore, tokenStorage };
