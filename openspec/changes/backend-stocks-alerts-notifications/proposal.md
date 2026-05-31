# Proposal: Backend Stocks + Alerts + Notifications

## Intent

Auth/database is done — the backend has identity but zero business logic. The mobile app needs stock data, alert CRUD, and push notifications to function. This change delivers the backend feature set that unblocks all mobile screens. It's the next correct slice because stock endpoints are dependency-gated by auth (existing JwtAuthGuard), alerts depend on stocks, and notification port is a hard dependency for FCM delivery on mobile.

## Scope

### In Scope

- Shared stock, alert, and notification types in `packages/shared`
- Stock provider abstraction (`IStockProvider`) + Finnhub adapter
- `GET /stocks` (list) and `GET /stocks/:symbol/chart` endpoints
- Alert CRUD + service with user-scoped access and idempotent creation via `clientRequestId`
- Alert evaluator: threshold crossing detection + duplicate-trigger prevention (cooldown window)
- Device token registration endpoint
- Notification port abstraction + Firebase Admin adapter baseline
- Critical tests: stock provider, alert evaluator, alert CRUD flow (≥8 tests)

### Out of Scope

- Mobile screens, offline queue, Android build, Docker, README/docs
- Advanced auth (refresh tokens, OAuth, password reset)
- Finnhub WebSocket streaming, rich FCM payload, delivery analytics

## Capabilities

**New**: `stocks` — stock listing, chart data, provider abstraction. `alerts` — CRUD, evaluator, idempotency. `notifications` — device registration, FCM dispatch.

**Modified**: None (pure new capabilities).

## Approach

Same Clean Architecture pattern as auth. Inward-out per domain: Domain entities + VOs → Application services + ports → Infrastructure adapters (Finnhub, Prisma repos, Firebase Admin) → Interfaces (controllers, module wiring). All endpoints protected by existing `JwtAuthGuard`. Scheduler via `@nestjs/schedule`. Prisma schema adds `Stock`, `Alert`, `DeviceToken` models via migration.

## Affected Areas

| Area                            | Impact | Description                                        |
| ------------------------------- | ------ | -------------------------------------------------- |
| `packages/shared/src/types/`    | New    | `stock.ts`, `alert.ts`, `notification.ts` exports  |
| `apps/api/src/domain/`          | New    | `stock/`, `alert/`, `notification/` entities + VOs |
| `apps/api/src/application/`     | New    | Service + port files for each domain               |
| `apps/api/src/infrastructure/`  | New    | `finnhub/`, `prisma/` repos, `firebase/` sender    |
| `apps/api/src/interfaces/`      | New    | Controllers + module for each domain               |
| `apps/api/prisma/schema.prisma` | Modify | Add Stock, Alert, DeviceToken models               |
| `apps/api/package.json`         | Modify | Add `@nestjs/schedule`, `firebase-admin`           |

## Risks

| Risk                | Likelihood | Mitigation                                                                                                     |
| ------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| PR >400 lines       | **High**   | Chain: PR-A (types + stock endpoints), PR-B (alerts + notifications). Feature-branch-chain with tracker branch |
| Finnhub unavailable | Med        | `MockStockProvider` implements same `IStockProvider`; env switch via `STOCK_PROVIDER=mock`                     |
| FCM blocks delivery | Med        | Notification port allows `ConsoleNotificationSender` swap; mobile polls alert status as fallback               |
| Time overrun        | Med        | Cut Finnhub → pure mock; cut FCM sender → console-only. Move to mobile regardless                              |

## Rollback Plan

Revert PR chain in reverse order (PR-B first, then PR-A). `pnpm -F api exec prisma migrate reset` drops new tables. `pnpm -F api remove @nestjs/schedule firebase-admin`. Zero impact on auth, health, mobile, shared.

## Dependencies

`@nestjs/schedule` (cron evaluator), `firebase-admin` (FCM), Finnhub API key (optional — mock works without it). Existing deps: Prisma, NestJS, JwtAuthGuard.

## Success Criteria

- [ ] `pnpm -F api test` passes (≥8 tests covering stock provider, alert evaluator, alert CRUD flow)
- [ ] `GET /stocks` returns stock list (mock or Finnhub data)
- [ ] `GET /stocks/:symbol/chart` returns time-series OHLC data
- [ ] `POST /alerts` with `Idempotency-Key: X` → 201; duplicate `X` → 409
- [ ] Alert evaluator triggers only when current price crosses threshold
- [ ] No duplicate triggers for same alert within 5-min cooldown
- [ ] `POST /devices/token` stores FCM registration token
- [ ] `pnpm lint` zero warnings
