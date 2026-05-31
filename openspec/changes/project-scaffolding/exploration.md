## Exploration: Project Scaffolding — Full-Stack React Native + Node Challenge

### Current State

**Greenfield repo**. The workspace is empty of application code. SDD context was initialized (`openspec/config.yaml`, skill registry, empty spec/changes directories). No package manager, no TypeScript config, no test framework, no source code exists yet.

### Affected Areas

- **Root** — monorepo workspace definition, shared tooling configs, CI
- `apps/api/` — new Node backend scaffold
- `apps/mobile/` — new React Native (Expo) scaffold
- `packages/shared/` — shared TypeScript types package

### Approaches

#### 1. Repo Topology: Monorepo vs Split

| Approach                        | Pros                                                                                                    | Cons                                                              | Complexity |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- |
| **Monorepo (PNPM workspaces)**  | Shared types via internal package; single CI; atomic cross-stack changes; easier review for a challenge | Slightly more complex root config; needs workspace-aware tooling  | Low        |
| **Two repos (client + server)** | True decoupling; independent deploy                                                                     | Twice the CI, PRs, config; no shared types without a publish step | Low        |

**Recommendation**: Monorepo with **PNPM workspaces**. The `packages/shared` package will hold API contracts (stock types, alert types, DTOs) consumed by both apps. Single PR for scaffold shows a unified first step. Turborepo is not needed yet — plain PNPM workspaces keep cognitive load low.

---

#### 2. Backend Framework

| Approach    | Pros                                                                                                                | Cons                                                                                        | Effort |
| ----------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| **Express** | Universal familiarity; huge ecosystem                                                                               | Manual boilerplate per route; no built-in validation; abandoned `request`/`response` typing | Low    |
| **Fastify** | Schema-based validation (JSON Schema); faster; plugin system isolates concerns; native WebSocket support; TS-native | Smaller community; plugin conventions take a minute to learn                                | Low    |
| **NestJS**  | Full DI; opinionated Clean Architecture templates; great DX                                                         | Heavy; slow cold start; overkill for a 2-3 route API challenge                              | Medium |
| **Hono**    | Ultra-light; edge-ready; excellent TS                                                                               | Newer; fewer enterprise patterns; smaller ecosystem                                         | Low    |

**Recommendation**: **Fastify**. Best balance of speed, validation, plugin isolation, and professionalism. No DI container needed — Fastify plugins with dependency injection via plugin encapsulation is sufficient. `@fastify/websocket` for Finnhub real-time data, `@fastify/swagger` for auto-generated API docs.

---

#### 3. Mobile Bootstrap: Expo vs RN CLI (FCM Tradeoff)

| Approach              | Pros                                                                                         | Cons                                                                      | FCM Tradeoff                                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Expo (managed)**    | Zero native config; OTA updates; `expo-notifications` handles FCM out of the box; fastest DX | Can't write custom native code; limited if complex notification UX needed | `expo-notifications` wraps FCM fully — works for standard push notifications. **Limitation**: can't customize notification service extension or handle complex background work without ejecting |
| **Expo (dev builds)** | Same DX as managed but can add custom native modules; keeps Expo tooling                     | Requires EAS Build; slightly more CI setup                                | Can add custom notification handlers via config plugins; best of both worlds                                                                                                                    |
| **RN CLI**            | Full native control; any library works; no Expo dependency                                   | Manual Android/iOS config; no OTA; more boilerplate for build tooling     | Full native access; can implement any FCM pattern including custom notification services, display over other apps, rich media notifications                                                     |

**Recommendation**: **Expo with development builds** (EAS Build + `expo-dev-client`). The FCM tradeoff is acceptable — `expo-notifications` handles 95% of real-world notification needs (registration, foreground/background handling, notification channels). Only need RN CLI if the challenge requires custom notification rendering or background service work. Expo's DX is _much_ faster for a challenge with a deadline.

---

#### 4. Persistence: Mobile Offline + Backend DB

| Approach                 | Pros                                                                                               | Cons                                                                | Effort |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------ |
| **AsyncStorage**         | Simplest API; good for small data                                                                  | Key-value only; no queries; no relations; slow for >1k items        | Low    |
| **SQLite (expo-sqlite)** | Full SQL; relational queries; mature; offline queue maps naturally to a `pending_operations` table | Requires schema migration plan; more verbose than ORMs              | Medium |
| **WatermelonDB**         | Reactive SQLite; built for offline-first sync; lazy loading; excellent for large datasets          | Heavier dependency; learning curve; may be overkill for a challenge | Medium |
| **MMKV**                 | Blazing fast key-value; synchronous reads                                                          | No relations; no queries; settings/tokens only                      | Low    |
| **Prisma (backend)**     | Type-safe query builder; excellent DX; migrations                                                  | Another dependency; overkill for small scope                        | Low    |

**Recommendation - Mobile**: **SQLite (`expo-sqlite`) + MMKV**. SQLite for structured data (watchlist, alerts, pending operations queue). MMKV for side-load values (FCM token, auth state, UI preferences). This is the professional choice — shows understanding of persistence strategy, not just "throw everything in AsyncStorage".

**Recommendation - Backend**: **Better-sqlite3 or SQLite via Prisma** for development speed. No need for PostgreSQL in a challenge. If the spec demands Postgres, use `pg` with a migration tool (`knex` or `node-pg-migrate`). Start with SQLite for zero-config and swap later if needed.

---

#### 5. Testing / Linting / Tooling Baseline

| Category           | Choice                                                                                                             | Rationale                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **Language**       | TypeScript (`strict: true`)                                                                                        | Non-negotiable for a professional submission                           |
| **Test (backend)** | Vitest                                                                                                             | Fast, TS-native, watch mode, Jest-compatible API, > Jest               |
| **Test (mobile)**  | Jest + React Native Testing Library                                                                                | De facto standard; `@testing-library/react-native` for component tests |
| **E2E (mobile)**   | Detox or Maestro (deferred to later slice)                                                                         | Not needed in scaffold; add when screens exist                         |
| **Linter**         | ESLint with `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-native` | Catch issues early                                                     |
| **Formatter**      | Prettier                                                                                                           | Consistent style; low-config                                           |
| **Git hooks**      | Husky + lint-staged                                                                                                | lint + type-check on pre-commit                                        |
| **CI**             | GitHub Actions — lint + test on push + PR                                                                          | Shows CI maturity                                                      |
| **Coverage**       | c8 (backend) / istanbul (mobile)                                                                                   | Set thresholds once business logic exists                              |

**Recommendation**: Wire all tooling in the first slice. This _is_ the scaffolding — trying to add ESLint/test config later is harder. Strict TypeScript from day one forces clean code.

---

#### 6. Initial Folder Structure (Clean Architecture — Pragmatic)

```
designli-challenge/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── domain/           # Entities, value objects
│   │   │   ├── application/      # Use cases, port interfaces
│   │   │   ├── infrastructure/   # Finnhub, DB, FCM adapters
│   │   │   ├── interfaces/       # Fastify routes/controllers
│   │   │   ├── config/           # Env vars, app config
│   │   │   └── main.ts           # Entry point
│   │   ├── tests/                # Mirror src/ structure
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mobile/
│       ├── src/
│       │   ├── domain/           # Domain types (mirrors shared)
│       │   ├── application/      # State management, use cases
│       │   ├── infrastructure/   # API client, DB, FCM service
│       │   └── presentation/
│       │       ├── components/
│       │       │   ├── atoms/    # Button, Text, Input
│       │       │   ├── molecules/# StockCard, AlertBadge
│       │       │   ├── organisms/# StockList, AlertForm
│       │       │   └── templates/# ScreenLayouts
│       │       ├── screens/      # Container components
│       │       └── navigation/   # React Navigation config
│       ├── tests/
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/                   # Shared API contracts
│       ├── src/
│       │   └── types/            # Stock, Alert, PaginatedResponse, etc.
│       ├── package.json
│       └── tsconfig.json
├── .github/
│   └── workflows/
│       └── ci.yml               # lint + test on push
├── .eslintrc.js                  # Shared root config
├── .prettierrc
├── .gitignore
├── .husky/                       # pre-commit hooks
│   └── pre-commit
├── package.json                  # Root workspace
├── pnpm-workspace.yaml
└── README.md
```

**Layer rules enforced by convention (no arch lint yet)**:

- `domain/` depends on NOTHING (pure types/functions)
- `application/` depends ONLY on `domain/`
- `infrastructure/` implements `application/` ports — depends on `application/` + external libs
- `interfaces/` (api) / `presentation/` (mobile) — outermost layer, depends on `application/`

---

#### 7. Risks, Tradeoffs, and MVP Boundary

**Risks**

| Risk                                                           | Likelihood | Impact | Mitigation                                                                                |
| -------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------- |
| Feature creep — try to build too much in first change          | High       | High   | Strict MVP boundary: scaffold only, zero business logic                                   |
| Finnhub API rate limits discovered mid-build                   | Medium     | Medium | Abstract Finnhub behind a repository interface from day one; add caching in a later slice |
| FCM setup blocks mobile scaffold                               | Medium     | Low    | Expo handles token registration; leave FCM handler implementation for later slice         |
| PNPM workspace version conflicts between backend + mobile deps | Low        | Medium | Pin shared TypeScript/ESLint versions in root config; avoid version drift                 |
| Architectural cargo-cult (empty layers with no purpose)        | Medium     | Low    | Only create directories that have at least one file; defer unused layers                  |

**MVP Boundary — What the first slice includes**

The first SDD change (`project-scaffolding`) MUST include:

1. Root workspace with PNPM (package.json, pnpm-workspace.yaml, .gitignore)
2. `apps/api` — Fastify + TypeScript skeleton, one health route (`GET /health` → 200)
3. `apps/mobile` — Expo dev build with one screen ("Hello Designli Challenge")
4. `packages/shared` — empty types package ready for contracts
5. ESLint + Prettier + Husky at root level (shared config)
6. Vitest (backend) + Jest/RNTL (mobile) wired with one passing test each
7. GitHub Actions CI — lint + test
8. TypeScript strict mode everywhere
9. Folder structure from §6 with `.gitkeep` files

**The first slice MUST NOT include**:

- Any business logic (no Finnhub, no alerts, no FCM handlers)
- Any real database setup
- Any navigation beyond a single screen
- Any offline queue code
- Any Docker or deployment config

This keeps the first PR under 400 lines and protects reviewability.

### Ready for Proposal

**Yes**. Proceed to `sdd-propose` for `project-scaffolding`. The exploration is concrete enough to draft a change proposal with clear scope, approach, and rollback plan.

Note for orchestrator: the `delivery_strategy` for this change should be `single-pr` — the scaffold is inherently under 400 lines by design.
