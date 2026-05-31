# Tasks: Mobile Auth Shell

## Review Workload Forecast

| Field                   | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| Estimated changed lines | 600–700                                                                        |
| 400-line budget risk    | High                                                                           |
| Chained PRs recommended | Yes                                                                            |
| Suggested split         | PR 1: API Client + Persistence; PR 2: Auth Store + Navigation + Login + Wiring |
| Delivery strategy       | ask-on-risk                                                                    |
| Chain strategy          | feature-branch-chain                                                           |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                                                    | Likely PR                      | Notes                        |
| ---- | --------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------- |
| 1    | Deps → domain ports → token-storage → api-client → auth.api → connectivity              | PR 1 (base=feature/auth-shell) | Tests pass with mocks        |
| 2    | auth.store → container.ts → LoginScreen → navigators → connectivity UI → App.tsx wiring | PR 2 (base=PR 1 branch)        | Presentation depends on PR 1 |

### Out of Scope Reminders

- No stock list, chart, alert, or FCM screens
- No offline alert queue or background sync
- No visual polish beyond baseline form state
- No E2E tests (Detox needs native builds)

## Phase 1: Foundation & Dependencies

- [x] 1.1 Add deps to `apps/mobile/package.json`: axios, react-native-mmkv, @react-navigation/\*, netinfo, zustand, expo-splash-screen
- [x] 1.2 Create `src/domain/auth-errors.ts` — NetworkError, AuthError, ServerError
- [x] 1.3 Create `src/domain/token-storage.port.ts` — abstract class with sync get()/set()/clear() (sync MMKV per design)
- [x] 1.4 Create `src/domain/auth.repository.port.ts` — abstract class with login(dto): Promise<AuthResponse>

## Phase 2: Data Layer — API Client & Persistence

- [x] 2.1 Create `src/data/token-storage.mmkv.ts` — implements TokenStorage via MMKV (sync getString/set/remove)
- [x] 2.2 Create `src/data/api-client.ts` — Axios factory: token injection interceptor, 401 clearing, error mapping
- [x] 2.3 Create `src/data/auth.api.ts` — implements AuthRepository via Axios POST /auth/login and /auth/register
- [x] 2.4 Create `src/data/connectivity.ts` — wraps NetInfo.addEventListener for subscription

## Phase 3: Application Layer — Auth Store & Wiring

- [ ] 3.1 Create `src/application/auth.store.ts` — Zustand: isAuthenticated, isLoading, error, login(), logout(), bootstrap()
- [ ] 3.2 Create `src/data/container.ts` — manual DI: MMKV → TokenStorage → Axios → AuthRepository → store factory

## Phase 4: Presentation Layer — Navigation & Login

- [ ] 4.1 Create `src/presentation/navigation/AuthStack.tsx` — native stack, single Login screen
- [ ] 4.2 Create `src/presentation/navigation/MainTabs.tsx` — bottom tabs: Stocks/Alerts/Settings placeholders
- [ ] 4.3 Create `src/presentation/navigation/AppNavigator.tsx` — NavigationContainer + conditional auth/tabs
- [ ] 4.4 Create `src/presentation/hooks/useConnectivity.ts` — NetInfo hook exposing isConnected
- [ ] 4.5 Create `src/presentation/components/ConnectivityBanner.tsx` — non-dismissible "No internet connection" banner
- [ ] 4.6 Create `src/presentation/screens/LoginScreen.tsx` — email/password form, validation, loading/error states

## Phase 5: Root Wiring

- [ ] 5.1 Modify `apps/mobile/App.tsx` — wrap with NavigationContainer, splash-screen hideAsync, ConnectivityProvider

## Phase 6: Tests

- [x] 6.1 Write `__tests__/token-storage.test.ts` — mock MMKV, verify set/get/clear delegation
- [x] 6.2 Write `__tests__/api-client.test.ts` — mock adapter: token injection, 401 clearing, error mapping
- [ ] 6.3 Write `__tests__/auth.store.test.ts` — mock ports: login success/failure, bootstrap with/without token, logout
