# Tasks: Backend Stocks + Alerts + Notifications

## Review Workload Forecast

| Field                   | Value                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| Estimated changed lines | ~600-800 (PR-A ~250, PR-B ~350-550)                                   |
| 400-line budget risk    | High                                                                  |
| Chained PRs recommended | Yes                                                                   |
| Suggested split         | PR-A: shared types + stocks; PR-B: alerts + notifications + scheduler |
| Delivery strategy       | ask-on-risk                                                           |
| Chain strategy          | pending                                                               |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                                      | Likely PR | Notes                                           |
| ---- | ------------------------------------------------------------------------- | --------- | ----------------------------------------------- |
| 1    | Shared types + Prisma schema + Stock module + stock tests                 | PR-A      | Base = main/tracker; self-contained; ~250 lines |
| 2    | Alert module + Notification module + Scheduler + wiring + remaining tests | PR-B      | Base = tracker (or PR-A branch); ~350-550 lines |

## Phase 1: Foundation — Shared Types, Prisma Schema, Dependencies

- [x] 1.1 Add `@nestjs/schedule` and `firebase-admin` deps to `apps/api/package.json` (deferred to PR-B)
- [x] 1.2 Create `packages/shared/src/types/stock.ts` — `StockListing`, `StockChartPoint`, `StockProviderConfig`
- [x] 1.3 Create `packages/shared/src/types/alert.ts` — `CreateAlertDTO`, `AlertResponse`, `AlertDirection`, `AlertStatus`
- [x] 1.4 Create `packages/shared/src/types/notification.ts` — `DeviceTokenDTO`, `AlertNotificationPayload`, `NotificationResult`
- [x] 1.5 Update `packages/shared/src/types/index.ts` to re-export new types
- [x] 1.6 Add `Alert` and `DeviceToken` models to `prisma/schema.prisma` per design (deferred to PR-B)
- [x] 1.7 Run `pnpm -F api exec prisma migrate dev --name add-alerts-device-tokens` (deferred to PR-B)

## Phase 2: Stock Module

- [x] 2.1 Create `application/stocks/ports/stock-provider.port.ts` — `IStockProvider` abstract class with `list()` and `chart()`
- [x] 2.2 Create `application/stocks/stocks.service.ts` — delegates to provider
- [x] 2.3 Create `infrastructure/stocks/mock-stock.provider.ts` — deterministic data
- [x] 2.4 Create `infrastructure/stocks/finnhub-stock.provider.ts` — `fetch()` Finnhub REST API
- [x] 2.5 Create `interfaces/stocks/stocks.controller.ts` — `GET /stocks`, `GET /stocks/:symbol/chart` with JwtAuthGuard
- [x] 2.6 Create `interfaces/stocks/stocks.module.ts` — DI wiring via `STOCK_PROVIDER` env var `useFactory`

## Phase 3: Alert Module

- [x] 3.1 Create `domain/alerts/alert.entity.ts` — plain class, zero framework imports
- [x] 3.2 Create `domain/alerts/alert-direction.vo.ts` — validates "above"|"below"
- [x] 3.3 Create `domain/alerts/alert-errors.ts` — `AlertAlreadyExistsError`
- [x] 3.4 Create `application/alerts/ports/alert-repository.port.ts` — `IAlertRepository` abstract class
- [x] 3.5 Create `application/alerts/alerts.service.ts` — CRUD + idempotency via `clientRequestId` unique + P2002 catch
- [x] 3.6 Create `application/alerts/alert-evaluator.service.ts` — threshold crossing + cooldown; single `list()` per cycle, tracked stock set explicit/controlled via `findAllActive()`
- [x] 3.7 Create `infrastructure/alerts/prisma-alert.repository.ts` — implements `IAlertRepository`
- [x] 3.8 Create `interfaces/alerts/alerts.controller.ts` — `POST /alerts`, `GET /alerts`, `DELETE /alerts/:id`
- [x] 3.9 Create `interfaces/alerts/alerts.module.ts`

## Phase 4: Notification Module

- [x] 4.1 Create `application/notifications/ports/notification-sender.port.ts` — `INotificationSender` abstract class
- [x] 4.2 Create `application/notifications/ports/device-token-repository.port.ts` — `IDeviceTokenRepository`
- [x] 4.3 Create `application/notifications/notifications.service.ts` — token registration/upsert
- [x] 4.4 Create `infrastructure/notifications/console-notification.sender.ts` — `console.log` adapter
- [x] 4.5 Create `infrastructure/notifications/firebase-notification.sender.ts` — `firebase-admin` adapter (lazy init, warns if unconfigured)
- [x] 4.6 Create `infrastructure/notifications/prisma-device-token.repository.ts` — implements `IDeviceTokenRepository`
- [x] 4.7 Create `interfaces/notifications/notifications.controller.ts` — `POST /devices/token`
- [x] 4.8 Create `interfaces/notifications/notifications.module.ts`

## Phase 5: Scheduler + App Wiring

- [x] 5.1 Create `infrastructure/scheduler/alert-evaluation.scheduler.ts` — `@Cron('*/30 * * * * *')` with `isEvaluating` guard (overlap prevention)
- [x] 5.2 Register `ScheduleModule.forRoot()`, `StocksModule`, `AlertsModule`, `NotificationsModule` in `app.module.ts`

## Phase 6: Testing (≥11 total)

- [x] 6.1 Unit: `MockStockProvider` returns deterministic shape (1 test) — 4 tests added, all passing
- [x] 6.2 Unit: `AlertEvaluatorService` — threshold crossed → sends; not crossed → skips (2 tests)
- [x] 6.3 Unit: `AlertEvaluatorService` — cooldown window skip; cooldown expired sends (2 tests)
- [x] 6.4 Unit: `AlertsService.create` — duplicate `clientRequestId` → throws (1 test)
- [x] 6.5 Integration: `POST /alerts` — Idempotency-Key → 201; duplicate → 409 (2 tests)
- [x] 6.6 Integration: `GET /stocks` — with JWT → 200; without → 401 (2 tests) — 5 stock controller tests added
- [x] 6.7 Integration: `POST /devices/token` → 201; duplicate token → 201 upsert (1 test)
- [x] 6.8 Verify `pnpm -F api test` passes all ≥11 tests, `pnpm lint` zero warnings (48 tests pass, 0 lint warnings)

## Out-of-Scope Reminders

- No `Stock` model in Prisma — stocks are external-only transient data
- No Finnhub WebSocket (`wss://`), no streaming
- No `Notification` / `NotificationLog` model (fire-and-forget push)
- No advanced auth (refresh tokens, OAuth, password reset)
- No update/toggle/search/batch endpoints for alerts
- Mobile screens, Android build, Docker, README/docs — deferred
