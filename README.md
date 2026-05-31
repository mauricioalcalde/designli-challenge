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
- **Stocks**: authenticated stock list with pull-to-refresh, stale fallback
- **Alerts**: CRUD: list, create with threshold/direction, delete
- **Notifications**: push registration readiness

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

- Push notification delivery is **registration-ready only** (no E2E push receipt).
- Backend uses SQLite (file-based, single-instance).
- Alert threshold evaluation requires a real Finnhub API key.
