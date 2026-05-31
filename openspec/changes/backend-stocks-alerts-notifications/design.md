# Design: Backend Stocks + Alerts + Notifications

## Technical Approach

Extend the Clean Architecture pattern established by `backend-auth-database`: inward-out per domain, abstract-class ports, `JwtAuthGuard` on all endpoints, Vitest + `Test.createTestingModule`. Three new modules (stocks, alerts, notifications) added as siblings to auth under the same four-layer structure. Prisma schema grows by exactly two models (`Alert`, `DeviceToken`) — stocks are external-only transient data. Chained PR: PR-A (shared types + stocks module), PR-B (alerts + notifications + scheduler).

## Architecture Decisions

| Decision                     | Choice                                                                                                                                     | Rejected                                            | Rationale                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prisma models**            | Only `Alert` + `DeviceToken`                                                                                                               | Also adding `Stock` table                           | Stocks are real-time external data; persisting them duplicates the provider. No `Notification` model — fire-and-forget push, no history scope                                   |
| **Idempotency**              | `@@unique([userId, clientRequestId])` on Alert + Prisma `P2002` catch                                                                      | Separate idempotency table, Redis, or in-memory map | Database IS the source of truth. Composite unique handles per-user scope, survives restarts, zero extra infra. Prisma's unique constraint provides atomic race-condition safety |
| **Cooldown enforcement**     | `lastTriggeredAt` field on Alert checked in evaluator                                                                                      | Separate trigger-log table or Redis TTL             | Single field, zero joins, evaluator logic is `now - lastTriggeredAt < COOLDOWN_MS ? skip : dispatch`. Configurable via `ALERT_COOLDOWN_MINUTES` (default 5)                     |
| **Scheduler decoupling**     | `AlertEvaluationScheduler` (infra) calls `AlertEvaluatorService` (app)                                                                     | Business logic in `@Cron` decorated method          | Application layer has ZERO framework imports. Scheduler is a thin 20-line trigger. Evaluator is pure unit-testable business logic                                               |
| **Stock price in evaluator** | One `list()` call per cycle builds price map; evaluate all alerts against it                                                               | `currentPrice(symbol)` per alert                    | 50 alerts → 50 API calls (waste). One `list()` → local price lookup per alert. O(n) memory, O(1) per-symbol API                                                                 |
| **Finnhub isolation**        | `FinnhubStockProvider` in `infrastructure/stocks/` implements `IStockProvider` from `application/stocks/ports/`                            | `axios` wrapper or direct `@nestjs/axios`           | Zero extra deps. `fetch()` built into Node 18+. Errors map to `StockProviderError` → controller catches → 503                                                                   |
| **Notification sender swap** | `INotificationSender` abstract class; `ConsoleNotificationSender` default; `FirebaseNotificationSender` via `NOTIFICATION_SENDER=firebase` | Hardcoded Firebase                                  | Same port pattern as `IStockProvider`. Console sender = zero-config development. Firebase init lazy — logs warning if unconfigured                                              |
| **Provider/factory swap**    | DI `useFactory` in module reads `STOCK_PROVIDER` / `NOTIFICATION_SENDER` env                                                               | Feature flags or runtime toggle                     | One env var, one restart. No runtime branching in application code                                                                                                              |

## Data Flow

```
Alert Evaluation Cycle (every 30s):
┌─────────────────────────────────────────────────────────┐
│ infrastructure/scheduler                                 │
│ AlertEvaluationScheduler.run()  ← @Cron('*/30 * * * * *')
│   │ guard: isEvaluating flag (skip if overlap)
│   ▼
│ application/alerts/AlertEvaluatorService.evaluateAll()
│   │ IStockProvider.list()
│   │   ├─ MockStockProvider → deterministic array
│   │   └─ FinnhubStockProvider → fetch() Finnhub /quote
│   │ IAlertRepository.findAllActive()
│   │ for each alert:
│   │   priceMap.get(alert.symbol) → price
│   │   isThresholdCrossed(alert, price)?
│   │     ├─ no → skip
│   │     └─ yes → cooldownCheck(alert)?
│   │              ├─ within window → skip
│   │              └─ expired → INotificationSender.send()
│   │                           updateLastTriggered(alert.id, now)
│   ▼
└─────────────────────────────────────────────────────────┘
```

## Prisma Schema Additions

```prisma
model Alert {
  id              Int       @id @default(autoincrement())
  clientRequestId String
  userId          Int
  symbol          String
  threshold       Float
  direction       String    // "above" | "below"
  active          Boolean   @default(true)
  lastTriggeredAt DateTime?
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id])
  @@unique([userId, clientRequestId])
}

model DeviceToken {
  id        Int      @id @default(autoincrement())
  userId    Int
  token     String   @unique
  platform  String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

## Module / File Layout

```
apps/api/src/
├── domain/
│   └── alerts/
│       ├── alert.entity.ts           # plain class, no NestJS
│       ├── alert-direction.vo.ts     # VO: validates "above"|"below"
│       └── alert-errors.ts           # AlertAlreadyExistsError, DomainError
├── application/
│   ├── stocks/
│   │   ├── ports/stock-provider.port.ts   # IStockProvider abstract class
│   │   └── stocks.service.ts              # delegates to provider
│   ├── alerts/
│   │   ├── ports/alert-repository.port.ts # IAlertRepository abstract class
│   │   ├── alerts.service.ts              # CRUD + idempotency
│   │   └── alert-evaluator.service.ts     # pure business logic (no framework)
│   └── notifications/
│       ├── ports/notification-sender.port.ts      # INotificationSender
│       ├── ports/device-token-repository.port.ts  # IDeviceTokenRepository
│       └── notifications.service.ts               # token registration
├── infrastructure/
│   ├── stocks/
│   │   ├── finnhub-stock.provider.ts  # fetch() Finnhub REST API
│   │   └── mock-stock.provider.ts     # deterministic test data
│   ├── alerts/
│   │   └── prisma-alert.repository.ts # implements IAlertRepository
│   ├── notifications/
│   │   ├── console-notification.sender.ts   # console.log adapter
│   │   ├── firebase-notification.sender.ts  # firebase-admin adapter
│   │   └── prisma-device-token.repository.ts
│   └── scheduler/
│       └── alert-evaluation.scheduler.ts   # @Cron → calls evaluator
├── interfaces/
│   ├── stocks/
│   │   ├── stocks.controller.ts
│   │   └── stocks.module.ts
│   ├── alerts/
│   │   ├── alerts.controller.ts
│   │   └── alerts.module.ts
│   └── notifications/
│       ├── notifications.controller.ts
│       └── notifications.module.ts
packages/shared/src/types/
├── stock.ts        # StockListing, StockChartPoint, StockProviderConfig
├── alert.ts        # CreateAlertDTO, AlertResponse, AlertDirection, AlertStatus
├── notification.ts # DeviceTokenDTO, AlertNotificationPayload, NotificationResult
└── index.ts        # re-export all
```

## IStockProvider Contract

```ts
// application/stocks/ports/stock-provider.port.ts
export abstract class IStockProvider {
  abstract list(): Promise<StockListing[]>;
  abstract chart(symbol: string, range: string): Promise<StockChartPoint[]>;
}
```

## Testing Strategy (≥11 tests)

| Layer       | Test                                                       | Count |
| ----------- | ---------------------------------------------------------- | ----- |
| Unit        | `MockStockProvider` returns deterministic shape            | 1     |
| Unit        | `AlertEvaluatorService`: threshold crossed → sends         | 1     |
| Unit        | `AlertEvaluatorService`: threshold NOT crossed → skips     | 1     |
| Unit        | `AlertEvaluatorService`: within cooldown → skips           | 1     |
| Unit        | `AlertEvaluatorService`: cooldown expired → sends          | 1     |
| Unit        | `AlertsService.create`: duplicate clientRequestId → throws | 1     |
| Integration | `POST /alerts` Idempotency-Key → 201                       | 1     |
| Integration | `POST /alerts` duplicate key → 409                         | 1     |
| Integration | `GET /stocks` with JWT → 200                               | 1     |
| Integration | `GET /stocks` without JWT → 401                            | 1     |
| Integration | `POST /devices/token` → 201                                | 1     |

Runner: Vitest (existing). Pattern: `Test.createTestingModule` with mocked ports for unit tests; mocked services for controller integration tests.

## Guardrails

1. **Domain purity**: zero NestJS/Prisma/Finnhub/Firebase/\@nestjs/schedule imports in `domain/`
2. **Port inversion**: zero `infrastructure/` imports in `application/` (except port abstract classes)
3. **No Stock model in Prisma**: stocks are external-only. Verifiable by grep `model Stock` in schema
4. **No Finnhub WebSocket**: REST-only. No `wss://`, no streaming, no `WebSocket` references
5. **Scheduler is infrastructure only**: `@nestjs/schedule` imported ONLY in `infrastructure/scheduler/`
6. **No notification history**: no `Notification` or `NotificationLog` model
7. **No extra endpoints**: only the six defined in specs. No update/toggle/search/batch
8. **No refresh tokens or advanced auth**: out of scope, deferred to future change
9. **PR budget**: chained: PR-A (~250 lines types+stocks), PR-B (~350 lines alerts+notifications+scheduler)

## Migration

`pnpm -F api exec prisma migrate dev --name add-alerts-device-tokens` adds `Alert` and `DeviceToken` tables. No data migration — greenfield tables.
