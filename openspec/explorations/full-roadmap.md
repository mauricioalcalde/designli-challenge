# Exploration: Full Roadmap — Designli Challenge

## Status

**DRAFT** — prepared for orchestrator/sdd-explore. Not tied to a named change; this is a meta-exploration for global delivery strategy.

---

## 1. Were the Previously Suggested 4 Milestones Enough?

**No.** The original scaffold exploration scoped only one change. There were no "4 milestones" formally defined — the scaffold's `exploration.md` covered tech choices and the first slice. We need a complete delivery roadmap from scratch.

The scaffold is **verified and complete** but **uncommitted** (master branch has zero commits). This is the first action item: commit the scaffold before any feature work.

---

## 2. Recommended End-to-End Roadmap

**Constraint**: 3 days for a complete, evaluable submission. The roadmap prioritizes a working end-to-end flow over theoretical perfection.

### Day 1 — Backend Foundation + Features

| Time | Change                                                 | Why Critical                                                                                        |
| ---- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| AM   | **Change 2: Backend Core — Auth + Database**           | Foundation: every feature needs auth and data                                                       |
| PM   | **Change 3: Backend Features — Stocks + Alerts + FCM** | Core business logic; backend must be feature-complete before mobile can test against real endpoints |

### Day 2 — Mobile App

| Time  | Change                                 | Why Critical                                                                                            |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| AM→PM | **Change 4: Mobile App (chained PRs)** | Largest work item. All screens, auth, offline, and notifications. Must finish for remaining polish time |

### Day 3 — Delivery

| Time | Change                               | Why Critical                                                 |
| ---- | ------------------------------------ | ------------------------------------------------------------ |
| AM   | **Change 5: Documentation + Docker** | README, ARCHITECTURE.md, AGENTIC_WORKFLOW.md, Docker Compose |
| PM   | **Delivery: Build + Video + Push**   | Android EAS Build, 4-min demo video, public repo push        |

---

## 3. SDD Change Boundaries (In Order)

### 🔴 CHANGE 2: Backend Core — Auth + Database

**Scope**: Database schema, auth module, shared types population.

- `packages/shared/src/types/` — User, Stock, Alert DTOs
- `apps/api` — Prisma with SQLite (User model), Auth module (register, login, JWT guard)
- `apps/api/src/domain/` — User entity + value objects (Email, Password)
- `apps/api/src/application/` — Auth use case (register, login), port interfaces (UserRepository)
- `apps/api/src/infrastructure/` — Prisma user repository, JWT service, Bcrypt hashing
- `apps/api/src/interfaces/` — Auth controller (register, login), JWT guard
- Tests: auth use case (unit), auth controller (integration), JWT guard
- **PR**: Single (~400-500 lines)
- **Delivery**: Single PR (or chained if DB migrations inflate it)

### 🔴 CHANGE 3: Backend Features — Stocks + Alerts + FCM

**Scope**: Stock data integration, alert CRUD, FCM notification trigger.

- `apps/api/src/domain/` — Stock entity, Alert entity + value objects (Price, Symbol, AlertStatus)
- `apps/api/src/application/` — Stock use case (list, chart data), Alert use case (CRUD, price-check, notify)
- `apps/api/src/infrastructure/` — Finnhub API adapter, Prisma stock + alert repositories, Firebase Admin FCM sender, price-check scheduler
- `apps/api/src/interfaces/` — Stock controller, Alert controller (with idempotency-key support)
- Tests: Stock use case (unit with mock provider), Alert use case (unit), price-check + FCM trigger logic, controller (integration)
- **PR**: Likely 500-700 lines → recommend **chained** (PR-A: Stock endpoints, PR-B: Alert CRUD + FCM)
- **Delivery**: Chained PR (feature-branch-chain, tracker branch)

### 🔴 CHANGE 4: Mobile Application (All Screens + Offline)

**Scope**: Complete mobile app — navigation, auth, stocks, chart, alerts, offline queue, FCM.

- Navigation: Auth stack (Login) → Main tabs (Stocks, Alerts, Chart)
- Screens: Login, StockList, StockChart, AlertForm, AlertList
- Infrastructure: API client (axios/fetch with interceptors), MMKV (tokens), expo-sqlite (offline queue), expo-notifications (FCM)
- State management: Zustand or React Context
- Offline: Prepare alert → queue to SQLite → sync when online → idempotency key generated on device
- Tests: Login flow, stock list render, alert form validation (unit + component tests)
- **PR**: 800-1200 lines → **MUST be chained** (3 PRs minimum)
  - PR 4a: Navigation + Auth + API client
  - PR 4b: Stock list + Chart screens
  - PR 4c: Alert screens + Offline queue + FCM
- **Delivery**: Chained PR (feature-branch-chain)

### 🟡 CHANGE 5: Documentation + Docker

**Scope**: All documentation, Docker, remaining polish.

- `README.md` — Setup guide, architecture overview, stack decisions, how to run
- `docs/ARCHITECTURE.md` — Clean Architecture layers, module boundaries, data flow diagrams, ADR log
- `docs/AGENTIC_WORKFLOW.md` — How SDD was used, change boundaries, agentic process
- `Dockerfile` for NestJS backend
- `docker-compose.yml` — Backend + SQLite (single service, simple)
- Tests: Any remaining critical tests
- **PR**: Single (~200-300 lines)

### 🟡 CHANGE 6: Delivery (Not an SDD Change)

- Android EAS Build (`eas build -p android --profile production`)
- 4-minute demo video (screen recording of full user flow)
- Public repo push to GitHub
- Remove `.gitkeep` files, final `pnpm lint` + `pnpm test`

---

## 4. Critical Path vs Optional Polish

| Tier                                | Items                                                                                                                               | Non-negotiable?                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **🔴 Tier 1 — Submission Killer**   | Auth works (login), Backend stock list + chart data, Alert CRUD, FCM notification delivered to device, Mobile app shows all screens | YES — without these submission is incomplete |
| **🔴 Tier 2 — Interview Signal**    | Offline queue + idempotency, Tests on critical logic, Clean Architecture visible in code structure                                  | YES — these are what the interview rewards   |
| **🟡 Tier 3 — Professional Signal** | Strong README, ARCHITECTURE.md, AGENTIC_WORKFLOW.md, Docker                                                                         | HIGH — docs are a stated requirement         |
| **🟢 Tier 4 — Delivery**            | Android build, Demo video, Public repo                                                                                              | YES — required for submission                |
| **⚪ Polish**                       | 100% test coverage, CI badge, Turborepo, E2E tests, FCM rich notifications, Push notification channels                              | NO — skip if time runs short                 |

### What to CUT if behind schedule (in order):

1. Skip Docker → just have it run locally with `pnpm -F api start:dev`
2. Skip AGENTIC_WORKFLOW.md → fold key points into README
3. Skip offline queue for alert creation → show online-only with idempotency keys
4. Skip chart screen → replace with a simple list showing current prices
5. Skip FCM on mobile → show notification in-app only (polling)

---

## 5. Acceptance Gates

### Gate: Change 2 — Backend Core + Auth

- [ ] `pnpm -F api test` passes (≥3 tests: auth use case, controller, guard)
- [ ] `POST /auth/register` returns JWT + user data
- [ ] `POST /auth/login` with valid credentials returns JWT
- [ ] Protected route with `@UseGuards(JwtAuthGuard)` returns 401 without token
- [ ] `apps/api/src/domain/` has real entities (not .gitkeep)
- [ ] `pnpm lint` zero warnings
- [ ] Prisma migration creates SQLite database with User table

### Gate: Change 3 — Backend Features

- [ ] `pnpm -F api test` passes (≥6 tests covering stock, alert, FCM)
- [ ] `GET /stocks` returns stock list (Finnhub or fallback mock)
- [ ] `GET /stocks/:symbol/chart` returns time-series data
- [ ] `POST /alerts` with `Idempotency-Key` header creates alert, duplicate key returns 409 (idempotency)
- [ ] `GET /alerts` returns user's alerts
- [ ] `DELETE /alerts/:id` deletes alert (own alerts only)
- [ ] Price-check scheduler sends FCM when current price > alert threshold
- [ ] `pnpm lint` zero warnings

### Gate: Change 4 — Mobile App

- [ ] `pnpm -F mobile test` passes (≥4 tests)
- [ ] User can register/login from mobile
- [ ] Token persisted in MMKV, survives app restart
- [ ] Stock list screen fetches and displays stocks
- [ ] Stock chart screen renders time-series data
- [ ] Alert form: create alert with symbol, threshold, direction
- [ ] Alert list: shows user's alerts with status
- [ ] Offline: alert form works without network, queues to SQLite
- [ ] Online sync: queued alerts submit when connectivity returns
- [ ] FCM token registered with backend
- [ ] Push notification displayed when price exceeds alert
- [ ] `pnpm lint` zero warnings

### Gate: Change 5 — Docs + Docker

- [ ] `README.md` has: project description, stack, setup in 3 commands, architecture overview
- [ ] `docs/ARCHITECTURE.md` has: layer diagram, module map, ADR entries, data flow
- [ ] `docs/AGENTIC_WORKFLOW.md` has: SDD cycle explanation, change log, agentic approach
- [ ] `docker-compose up` starts backend on port 3000
- [ ] `pnpm test` passes across all workspaces
- [ ] All `.gitkeep` files removed

### Gate: Delivery

- [ ] Android `.apk` or `.aab` build succeeds
- [ ] 4-min demo video recorded (login → stocks → chart → create alert → see notification)
- [ ] GitHub repository is public
- [ ] Final commit with all deliverables pushed
- [ ] Last `pnpm lint && pnpm test` passes clean

---

## 6. Risks That Could Derail the 3-Day Challenge

| #   | Risk                                                  | Likelihood | Impact                                                   | Hedge                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------- | ---------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Finnhub API unavailable / rate-limited**            | Medium     | High — stock data is core feature                        | Add a `MockStockProvider` that implements the same `StockProvider` interface. App works with mock data if Finnhub fails. Swap via config/env                                                                                                       |
| 2   | **FCM setup blocks both backend + mobile**            | Medium     | High — notification is stated requirement                | Backend: Firebase Admin SDK setup with service account. Mobile: `expo-notifications` handles registration. **Risk multiplier**: both sides must work together. Hedge: add a fallback polling mechanism on mobile that checks alert status directly |
| 3   | **EAS Build fails on first attempt**                  | Medium     | Medium — Android build needed for submission             | Start EAS build early (Day 2) in parallel with mobile work. Don't wait until Day 3                                                                                                                                                                 |
| 4   | **Offline sync complexity exceeds time budget**       | High       | Medium — strategic requirement but not submission-killer | Build offline queue as a **simplified version**: queue to SQLite, flush on connectivity change (NetInfo), idempotency key on client. If stuck, ship online-only with idempotency headers                                                           |
| 5   | **Mobile charting library incompatibility with Expo** | Low-Medium | Medium                                                   | Test the chosen library (`react-native-chart-kit` or `victory-native`) on Day 1 in a minimal Expo test. Have `react-native-svg-charts` as fallback, or render a simple table if all fail                                                           |
| 6   | **Time overrun on Day 1 backend work**                | High       | High — domino effect on mobile time                      | Strict timebox: 6 hours for Change 2, 6 hours for Change 3. If over, cut Finnhub integration → use MockStockProvider exclusively. Move to mobile by end of Day 1 regardless                                                                        |
| 7   | **No commits yet on master**                          | Certain    | Low — but needs action                                   | First action: `git add && git commit -m "feat: project scaffold"` before any feature work. Without this, we lose ability to rollback or PR                                                                                                         |

---

## 7. Next Immediate Change After Scaffolding

**Recommended: `backend-auth-database`**

### Rationale

1. **Auth is the dependency gate** — every other feature (stocks, alerts) requires authentication. Build it first.
2. **Database must exist before data work** — Prisma schema + SQLite is the foundation for all backend features.
3. **Clean Architecture pattern is established here** — this is where `domain/`, `application/`, `infrastructure/`, `interfaces/` get their real first files. Sets the pattern for all future changes.
4. **Lowest risk** — auth is well-understood, JWT is standard, Prisma is mature.

### Pre-flight Checklist Before Starting Change 2

- [ ] Commit scaffold to master (`feat: project scaffold`)
- [ ] Add `@designli-challenge/shared: workspace:*` to `apps/api/package.json` (fixes verify-report WARNING)
- [ ] Verify `pnpm install` still resolves after shared dep added
- [ ] Create initial git tag (`v0.1.0-scaffold`)
- [ ] Confirm Prisma CLI is installable (`pnpm -F api add prisma @prisma/client`)

---

## Appendix: Tooling/Library Decisions (Pragmatic)

| Category          | Choice                                         | Why                                                                           |
| ----------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| **DB**            | SQLite via Prisma                              | Zero config, no Docker dependency, Prisma gives migrations + type-safe client |
| **Auth**          | JWT (access + refresh)                         | Stateless, standard, no session store needed                                  |
| **FI**            | Finnhub (REST)                                 | Free tier covers US stocks, REST is simpler than WebSocket for a challenge    |
| **Chart**         | react-native-chart-kit                         | Works with Expo, simple API, good enough for line charts                      |
| **Offline**       | expo-sqlite                                    | Same DB engine concept, works offline, familiar SQL                           |
| **State**         | Zustand                                        | Minimal boilerplate, TypeScript-native, no provider wrapping                  |
| **HTTP**          | axios (mobile)                                 | Interceptors for token refresh, request/response transforms                   |
| **Notifications** | expo-notifications + firebase-admin (backend)  | Expo handles device-side, Firebase Admin handles server-side send             |
| **Docker**        | Single Dockerfile for backend + docker-compose | Multi-stage build, Alpine for small image                                     |

## Ready for Proposal

**Yes** — proceed to `sdd-propose` for `backend-auth-database` (Change 2). The exploration is concrete enough to draft a change proposal with clear scope, approach, and rollback plan.

Note for orchestrator: `backend-auth-database` is forecast at ~400-500 lines — near the budget boundary. Recommend `ask-on-risk` delivery strategy for this change.
