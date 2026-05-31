# Proposal: Mobile Auth Shell

## Intent

Backend is feature-complete — mobile has only a welcome screen. Auth is the dependency gate for every mobile feature: no login = no stock list, chart, alert, or FCM. This slice delivers auth, navigation shell, and the API client pattern.

## Scope

**In Scope**: Axios API client (interceptors, 401 handling). Auth contracts from `@designli-challenge/shared`. Login screen (email/password, validation, loading/error). Token persistence via MMKV. Auth shell: NavigationContainer, stack (Login) → tab skeleton. NetInfo connectivity banner on auth screen. Mobile Clean Architecture: `domain/`, `application/`, `data/`, `presentation/`. Tests for login, persistence, API client, connectivity.

**Out of Scope**: Stock list, chart, alert screens. Offline alert queue, FCM registration. Visual polish beyond baseline. Tab content beyond placeholders.

## Capabilities

**New**: `mobile-api-client` — Axios instance, token injection, error mapping. `mobile-auth` — login screen, MMKV persistence, auth state. `mobile-navigation` — auth shell, stack/tabs skeleton, connectivity provider.
**Modified**: None.

## Approach

Inward-out Clean Architecture on mobile. `domain/` (auth entity + port). `application/` (Zustand login use case + auth state). `data/` (Axios API client, MMKV token storage, NetInfo). `presentation/` (Login screen, auth stack, tab skeleton).

## Affected Areas

| Area                            | Impact   | Key Files                                                     |
| ------------------------------- | -------- | ------------------------------------------------------------- |
| `apps/mobile/package.json`      | Modified | Add axios, mmkv, react-navigation, netinfo, zustand           |
| `apps/mobile/src/domain/`       | New      | auth.repository.port.ts                                       |
| `apps/mobile/src/application/`  | New      | auth.store.ts                                                 |
| `apps/mobile/src/data/`         | New      | api-client.ts, auth.api.ts, token-storage.ts, connectivity.ts |
| `apps/mobile/src/presentation/` | New      | LoginScreen, AuthStack, MainTabs, providers                   |
| `apps/mobile/App.tsx`           | Modified | Providers wrapping                                            |
| `apps/mobile/__tests__/`        | Modified | Login flow, persistence, API client specs                     |

## Risks

| Risk                                  | Likelihood | Mitigation                                                                    |
| ------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| PR over 400 lines                     | Medium     | Auto-chain: slice 1 (api + persistence), slice 2 (navigation + login + tests) |
| Navigation boilerplate inflates code  | Low        | Three-file skeleton only — no deep customization                              |
| Storage choice (MMKV vs AsyncStorage) | Low        | Interface behind TokenStorage port. Swap if wrong                             |

## Rollback Plan

Revert PR. `pnpm -F mobile remove` new deps. Restore App.tsx to single-welcome-screen. Zero backend impact.

## Dependencies

`axios`, `react-native-mmkv`, `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`, `@react-native-community/netinfo`, `zustand`.

## Success Criteria

- [ ] Login form renders email/password with validation
- [ ] Valid credentials → token saved to MMKV → navigates to tabs
- [ ] Invalid credentials → error message on screen
- [ ] Connectivity lost → banner shown on auth screen
- [ ] Token on cold start → bypasses login, goes to tabs
- [ ] 401 response → token cleared → returns to login
- [ ] `pnpm -F mobile test` passes (≥4 tests)
- [ ] `pnpm lint` zero warnings
- [ ] Clean Architecture layers present: domain/, application/, data/, presentation/
