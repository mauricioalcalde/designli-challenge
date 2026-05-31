# Design: Mobile Auth Shell

## Technical Approach

Inward-out Clean Architecture for React Native. Inner layers (domain, application) define contracts; outer layers (data, presentation) implement and wire them. No DI framework — a single `container.ts` performs manual composition, matching the backend's philosophy without overengineering. Zustand manages auth state reactively; React Navigation switches between AuthStack and MainTabs based on `isAuthenticated`.

## Architecture Decisions

| Decision             | Options                                                 | Tradeoffs                                                                                                                                                                       | Choice                                                                                  |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Token storage**    | MMKV, AsyncStorage, expo-secure-store                   | MMKV: synchronous reads (no flash), 30x faster than AsyncStorage. expo-secure-store: encrypted but async-only, no Windows support for dev. AsyncStorage: deprecated for KV use. | **MMKV** behind `TokenStorage` abstract port                                            |
| **API client**       | Axios, fetch, ky                                        | Axios: interceptors for token injection + 401 handling built-in. fetch: no interceptor model, requires wrapper.                                                                 | **Axios** singleton created by factory                                                  |
| **Auth bootstrap**   | SplashScreen API, conditional root, loading state       | SplashScreen API: native splash visible until `hideAsync()`, no flash. Conditional root: renders null → Login flash. Loading state: same flash problem.                         | **expo-splash-screen** with `preventAutoHideAsync()`; `bootstrap()` hides it on resolve |
| **Navigation shell** | Conditional rendering, reset action, switch navigator   | Conditional rendering: React state → React Navigation re-mount, cleanest. Switch navigator: deprecated in v7. Reset action: extra complexity, no gain.                          | **Conditional rendering**: `isAuthenticated ? <MainTabs> : <AuthStack>`                 |
| **Connectivity**     | `@react-native-community/netinfo`, custom, expo-network | NetInfo: battle-tested, hook-based, zero-cost.                                                                                                                                  | **NetInfo** consumed via `useConnectivity()` hook                                       |
| **Wiring/DI**        | InversifyJS, tsyringe, manual `container.ts`            | Inversify: heavy decorator API, 20KB bundle. tsyringe: still decorators, experimental. Manual: 30-line file, no runtime cost, matches backend spirit.                           | **Manual `container.ts`**                                                               |
| **Test isolation**   | Mock ports, mock axios, mock MMKV                       | Mock ports: test auth store without network or storage. Mock axios: needed for api-client unit tests.                                                                           | **Mock ports** for application-layer tests; **mock axios** for data-layer               |

## Data Flow

```
 LoginScreen ──→ auth.store.login() ──→ AuthRepository.login()
      │                    │                     │
      │              Zustand state         Axios POST /auth/login
      │              (reactivity)                │
      ▼                    │              ┌──────┴──────┐
 ConnectivityBanner        │              │  401 → clear │
  (useConnectivity)        ▼              │  token +     │
                     TokenStorage.set()    │  logout()    │
                     (MMKV synchronous)    └─────────────┘
```

**Cold start**: `App.tsx` → renders nothing → `auth.store.bootstrap()` → `TokenStorage.get()` → if token: `isAuthenticated=true` → `SplashScreen.hideAsync()` → renders `<MainTabs>`. If no token: `isAuthenticated=false` → `hideAsync()` → renders `<AuthStack>`.

## File Changes

| File                                                             | Action     | Description                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/domain/auth.repository.port.ts`                 | Create     | Abstract `AuthRepository` with `login(dto): Promise<AuthResponse>`                                                                                                                                                                                             |
| `apps/mobile/src/domain/token-storage.port.ts`                   | Create     | Abstract `TokenStorage` with `get()`, `set()`, `clear()`                                                                                                                                                                                                       |
| `apps/mobile/src/domain/auth-errors.ts`                          | Create     | Typed errors: `NetworkError`, `AuthError`, `ServerError` — all extend `Error`                                                                                                                                                                                  |
| `apps/mobile/src/application/auth.store.ts`                      | Create     | Zustand store: `isAuthenticated`, `isLoading`, `error`, `login()`, `logout()`, `bootstrap()`                                                                                                                                                                   |
| `apps/mobile/src/data/api-client.ts`                             | Create     | Axios instance factory: base URL, request interceptor (token injection), response interceptor (error mapping + 401 → clear token + emit logout)                                                                                                                |
| `apps/mobile/src/data/auth.api.ts`                               | Create     | `AuthRepository` impl using `api-client` — `login()` and `register()`                                                                                                                                                                                          |
| `apps/mobile/src/data/token-storage.mmkv.ts`                     | Create     | `TokenStorage` impl using synchronous MMKV `getString()`/`set()`/`delete()`                                                                                                                                                                                    |
| `apps/mobile/src/data/connectivity.ts`                           | Create     | Wraps `NetInfo.addEventListener()` in a subscription function consumed by the hook                                                                                                                                                                             |
| `apps/mobile/src/data/container.ts`                              | Create     | Manual composition: creates MMKV instance → TokenStorage → Axios → AuthRepository → passes to store factory                                                                                                                                                    |
| `apps/mobile/src/presentation/screens/LoginScreen.tsx`           | Create     | Email + password form, 3 visual states, consumes `auth.store`                                                                                                                                                                                                  |
| `apps/mobile/src/presentation/navigation/AuthStack.tsx`          | Create     | Native stack with single `Login` screen                                                                                                                                                                                                                        |
| `apps/mobile/src/presentation/navigation/MainTabs.tsx`           | Create     | Bottom tabs: Stocks, Alerts, Settings — all placeholder screens                                                                                                                                                                                                |
| `apps/mobile/src/presentation/navigation/AppNavigator.tsx`       | Create     | `NavigationContainer` + conditional `{isAuthenticated ? <MainTabs> : <AuthStack>}`                                                                                                                                                                             |
| `apps/mobile/src/presentation/hooks/useConnectivity.ts`          | Create     | Subscribes to NetInfo, exposes `isConnected: boolean`                                                                                                                                                                                                          |
| `apps/mobile/src/presentation/components/ConnectivityBanner.tsx` | Create     | Non-dismissible banner: "No internet connection" — renders when `!isConnected`                                                                                                                                                                                 |
| `apps/mobile/App.tsx`                                            | **Modify** | Wrap with `NavigationContainer`, `ConnectivityProvider`; keep `StatusBar`                                                                                                                                                                                      |
| `apps/mobile/package.json`                                       | **Modify** | Add: `axios`, `react-native-mmkv`, `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`, `@react-native-community/netinfo`, `zustand`, `expo-splash-screen` |
| `apps/mobile/__tests__/`                                         | Create     | `auth.store.test.ts`, `api-client.test.ts`, `token-storage.test.ts`                                                                                                                                                                                            |
| `apps/mobile/__tests__/App.test.tsx`                             | **Modify** | Update to work with provider wrappers                                                                                                                                                                                                                          |

## Interfaces / Contracts

```typescript
// domain/token-storage.port.ts
export abstract class TokenStorage {
  abstract get(): string | null; // synchronous — MMKV reads are sync
  abstract set(token: string): void;
  abstract clear(): void;
}

// domain/auth-errors.ts
export class NetworkError extends Error {
  name = 'NetworkError';
}
export class AuthError extends Error {
  name = 'AuthError';
}
export class ServerError extends Error {
  name = 'ServerError';
}
```

`AuthRepository` reuses `LoginDTO` + `AuthResponse` from `@designli-challenge/shared`.

The 401 interceptor in `api-client.ts` calls `tokenStorage.clear()` directly — this is a **pragmatic layer crossing**: the interceptor is infrastructure glue, not business logic. The auth store subscribes to a logout event via a passed callback, preserving testability (mock the callback).

## Testing Strategy

| Layer           | What to Test         | Approach                                                                           | Min Cases                                                                           |
| --------------- | -------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Application** | `auth.store`         | Mock `AuthRepository` + `TokenStorage` ports; test state transitions               | `login()` success, `login()` failure, `bootstrap()` with/without token, `logout()`  |
| **Data**        | `api-client`         | Mock Axios adapter (axios-mock-adapter); test 401 interceptor clears token         | Token injection, 401 → token cleared, `NetworkError` mapping, `ServerError` mapping |
| **Data**        | `token-storage.mmkv` | Mock MMKV instance; verify `set`/`get`/`clear` delegation                          | Set → get returns same token, clear → get returns null                              |
| **Integration** | Login screen         | Render LoginScreen with mocked store; test field validation + loading/error states | Submit disabled during load, error message shown on failure                         |

**Total: ≥8 tests** (exceeds the ≥4 minimum). No E2E — RN E2E (Detox) requires native builds, out of scope for this slice.

## Migration / Rollout

No migration required — greenfield addition. Rollback: revert PR, `pnpm -F mobile remove` new deps, restore `App.tsx` to single welcome screen. Zero backend impact.

## Open Questions

None. All decisions are resolved in the proposal and specs.
