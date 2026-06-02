# Designli Challenge — Full-Stack React Native + Node.js

Stock alert platform: mobile app (React Native/Expo) + backend API (NestJS/Prisma/SQLite).

## Quick Start

```bash
git clone <repo-url> && cd Designli-Challenge

pnpm setup        # install + generate Prisma client + run migrations
pnpm dev:api      # terminal 1: backend at http://localhost:3000
pnpm dev:mobile   # terminal 2: Expo Metro (press a for Android, i for iOS)
```

## Scripts

| Command                     | What it does                                         |
| --------------------------- | ---------------------------------------------------- |
| `pnpm setup`                | Install deps, generate Prisma client, run migrations |
| `pnpm dev:api`              | Start backend in watch mode (`localhost:3000`)       |
| `pnpm dev:mobile`           | Start Expo dev server                                |
| `pnpm dev:mobile:android`   | Expo → Android emulator                              |
| `pnpm dev:mobile:ios`       | Expo → iOS simulator                                 |
| `pnpm build:api`            | NestJS production build                              |
| `pnpm build:mobile:android` | Compile and install Android dev build                |
| `pnpm build:mobile:ios`     | Compile and install iOS dev build                    |
| `pnpm test`                 | Run all tests (API + mobile)                         |
| `pnpm typecheck`            | TypeScript check both packages                       |
| `pnpm lint`                 | ESLint across repo                                   |

## Verified Delivery Evidence

| Item                         | Command / Artifact                                                                                                                                                                                                                                        | Status  | Evidence                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notification truth contract  | `pnpm --filter @designli-challenge/api exec vitest run src/application/alerts/alert-evaluator.service.spec.ts src/infrastructure/notifications/console-notification.sender.spec.ts src/infrastructure/notifications/firebase-notification.sender.spec.ts` | pass    | 15/15 tests passed on 2026-05-31 after token-lookup + `sent/skipped/failed` changes.                                                              |
| Login-shell boot isolation   | `pnpm --filter @designli-challenge/mobile exec jest --runInBand __tests__/App.test.tsx __tests__/navigation-shell.test.tsx __tests__/auth-shell-flow.test.tsx`                                                                                            | pass    | 3 suites, 10 tests passed; auth boot still avoids chart-path imports.                                                                             |
| Workspace lint               | `pnpm lint`                                                                                                                                                                                                                                               | pass    | ESLint exited successfully; current repo still emits 3 pre-existing test warnings.                                                                |
| API Docker image             | `docker compose build api`                                                                                                                                                                                                                                | pass    | `Dockerfile.api` builds successfully after installing OpenSSL and preserving pnpm workspace links.                                                |
| API Docker startup           | `docker compose up -d api`                                                                                                                                                                                                                                | pass    | Service starts on `http://localhost:3001`; `/stocks` with an invalid bearer token returns HTTP 401, proving the auth-safe shell is up.            |
| Root API build               | `pnpm build:api`                                                                                                                                                                                                                                          | fail    | Prisma `prebuild` intermittently fails on Windows with `EPERM ... query_engine-windows.dll.node.tmp -> query_engine-windows.dll.node`.            |
| Root typecheck               | `pnpm typecheck`                                                                                                                                                                                                                                          | fail    | Same Prisma generate `EPERM` failure in `pretypecheck`; mobile typecheck is not reached when API prehook fails.                                   |
| Root test                    | `pnpm test`                                                                                                                                                                                                                                               | fail    | Same Prisma generate `EPERM` failure in `pretest`; the aggregate command stops before the mobile suite.                                           |
| End-to-end Firebase delivery | Firebase Admin credentials + real device token                                                                                                                                                                                                            | blocked | This repo now uses persisted tokens only, but no verified credential/device pair was available in this slice, so full FCM receipt is NOT claimed. |

### Docker quick check

```bash
docker compose build api
docker compose up -d api
# API is published on http://localhost:3001
docker compose down
```

## Architecture

```
apps/
├── api/       NestJS + Prisma + SQLite (port 3000)
└── mobile/    React Native + Expo + Zustand + MMKV

packages/
└── shared/    TypeScript types shared across apps
```

### API Endpoints

| Method | Path                    | Auth |
| ------ | ----------------------- | ---- |
| POST   | `/auth/register`        | No   |
| POST   | `/auth/login`           | No   |
| GET    | `/stocks`               | JWT  |
| GET    | `/stocks/:symbol/chart` | JWT  |
| GET    | `/alerts`               | JWT  |
| POST   | `/alerts`               | JWT  |
| DELETE | `/alerts/:id`           | JWT  |
| POST   | `/devices/token`        | JWT  |

### Mobile screens

- **Auth**: login / register
- **Stocks**: authenticated stock list with controlled near real-time polling via the backend, pull-to-refresh, and cached/offline fallback
- **Alerts**: CRUD: list, create with threshold/direction, delete
- **Notifications**: push registration readiness

### Market Data Notes

- The mobile app polls the backend `GET /stocks` endpoint on a controlled interval while the Stocks screen is focused, the app is active, and the device is online. It does not open a websocket to Finnhub.
- Pull-to-refresh is a manual mobile action only. Background polling is separate and keeps the current list visible instead of replacing it with a full-screen loader.
- The backend alert evaluator scheduler is independent from mobile polling. Alert checks continue on the backend cadence and do not depend on the Stocks screen being open.
- There is no backend quote-cache TTL implemented today in `FinnhubStockProvider`; it currently fetches Finnhub quotes directly per request. If a cache layer is added later, the expected architecture is a short backend TTL of about 10-15 seconds, with mobile still polling the backend only.

## Environment

### API (`apps/api/.env`)

```env
JWT_SECRET=your-secret
```

See `apps/api/.env.example`.

### Mobile (`apps/mobile/.env`)

No config needed for Android emulator or iOS simulator.
For physical device testing, set `EXPO_PUBLIC_API_HOST` to your LAN IP.
See `apps/mobile/.env.example`.

## Manual QA Checklist

1. `pnpm dev:api`
2. `pnpm dev:mobile` → press `a`
3. **Register** → **Login**
4. **Stocks** tab: list loads, pull-to-refresh works
5. **Alerts** tab: create alert with symbol/threshold/direction, delete alert
6. **Notifications** tab: permission prompt, token registration status

### Android dev build (for notifications)

```bash
pnpm build:mobile:android     # compile native app
pnpm dev:mobile -- --dev-client  # Metro for dev client
```

## Limitations

- Push notification delivery uses persisted device tokens and returns `sent`, `skipped`, or `failed`, but real Firebase receipt proof is still **blocked** without valid Firebase Admin credentials and a real registered device.
- Backend uses SQLite (file-based, single-instance).
- Alert threshold evaluation requires a real Finnhub API key.
