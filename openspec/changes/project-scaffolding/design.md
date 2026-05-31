# Design: Project Scaffolding

## Technical Approach

Greenfield PNPM monorepo. Three workspaces wired via `pnpm-workspace.yaml` (`apps/*`, `packages/*`). Root owns shared tooling (ESLint, Prettier, Husky, CI). Each app is an independent workspace with its own `tsconfig.json`, `package.json`, and test runner. `packages/shared` exports TypeScript types consumed by both apps via workspace protocol (`"@designli-challenge/shared": "workspace:*"`). No Turborepo yet — plain PNPM scripts keep cognitive load low.

Backend uses `@nestjs/cli` to generate the minimal NestJS skeleton. Mobile uses `create-expo-app` with dev-build template. Clean Architecture layer skeletons with `.gitkeep` files enforce the mental model without fake abstraction theater.

## Architecture Decisions

| Decision               | Option A             | Option B (Chosen)              | Rationale                                                                                                                                                                                                                                                                   |
| ---------------------- | -------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend framework      | Fastify              | **NestJS**                     | DI container + decorator-driven controllers map directly to Clean Architecture layers. `@Module()` enforces separation. Fastify requires manual discipline to avoid layer bleed. Health route is trivial in both; NestJS pays off when use cases, guards, and pipes arrive. |
| Workspace orchestrator | Turborepo            | **Plain PNPM scripts**         | Scaffold has zero build dependency graph. Turborepo adds config overhead for no gain yet. Revisit when apps need build caching.                                                                                                                                             |
| Mobile bootstrap       | Expo managed         | **Expo dev builds**            | No custom native code now, but dev builds don't lock us out. `expo-dev-client` + EAS Build for CI.                                                                                                                                                                          |
| Test runner (API)      | Jest                 | **Vitest**                     | Faster, TS-native, no `ts-jest` config dance. Jest-compatible API so migration cost is zero.                                                                                                                                                                                |
| Test runner (Mobile)   | Vitest               | **Jest + RNTL**                | React Native Testing Library + Jest is the de facto standard. Expo's default template uses Jest.                                                                                                                                                                            |
| Root config strategy   | Per-workspace        | **Root extends per workspace** | Root `.eslintrc.js` defines base rules. Each workspace extends and adds context-specific plugins (e.g., `react-hooks` only in mobile).                                                                                                                                      |
| Layer enforcement      | eslint-plugin-import | **Convention only**            | Arch lint tool (dependency-cruiser) deferred. Scaffold has zero logic — no imports to enforce. Add when first use case lands.                                                                                                                                               |

## Data Flow

```
pnpm install ──→ resolves all workspaces
                    ├── apps/api (NestJS + strict TS)
                    ├── apps/mobile (Expo + strict TS)
                    └── packages/shared (bare TS)

CI push/PR ──→ install ──→ lint (all workspaces)
                         └── test (api) ─┐
                         └── test (mobile) ┘ parallel

Dev flow:
  pnpm -F api start:dev    → GET /health → { status: "ok" }
  pnpm -F mobile start     → Expo dev client → Welcome screen
  pnpm lint                → ESLint all workspaces
  pnpm format              → Prettier all workspaces
  git commit               → Husky → lint-staged (auto)
```

## File Changes

| File                                            | Action | Description                                                                                    |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `package.json`                                  | Create | Root workspace: scripts for lint, format, test; devDeps (ESLint, Prettier, Husky, lint-staged) |
| `pnpm-workspace.yaml`                           | Create | Declare `apps/*` and `packages/*`                                                              |
| `.eslintrc.js`                                  | Create | Root ESLint config: `@typescript-eslint`, Prettier integration                                 |
| `.prettierrc`                                   | Create | Shared Prettier config                                                                         |
| `.gitignore`                                    | Create | Node modules, build artifacts, Expo `.expo/`, env files, `.husky/_/`                           |
| `.husky/pre-commit`                             | Create | `npx lint-staged`                                                                              |
| `.github/workflows/ci.yml`                      | Create | Install → parallel lint + test (both apps), on push/PR to main                                 |
| `apps/api/`                                     | Create | NestJS skeleton via `@nestjs/cli`; health module; Clean Arch folders with `.gitkeep`           |
| `apps/api/src/health/health.controller.ts`      | Create | `GET /health` → `{ status: "ok" }`                                                             |
| `apps/api/src/health/health.controller.spec.ts` | Create | One Vitest test: controller returns 200 with `{ status: "ok" }`                                |
| `apps/mobile/`                                  | Create | Expo dev-build; single `App.tsx` welcome screen; atomic design folders                         |
| `apps/mobile/__tests__/App.test.tsx`            | Create | One Jest+RNTL test: renders welcome text                                                       |
| `packages/shared/`                              | Create | `package.json`, `tsconfig.json`, `src/types/index.ts` (empty barrel export)                    |

## Interfaces / Contracts

```typescript
// GET /health response (only contract in this slice)
interface HealthResponse {
  status: 'ok';
}
```

`packages/shared/src/types/index.ts` exports nothing yet — the barrel file exists as a placeholder. Future slices add `Stock`, `Alert`, `PaginatedResponse<T>`, and API DTOs here.

## Testing Strategy

| Layer            | What                                          | Tool              | Count                    |
| ---------------- | --------------------------------------------- | ----------------- | ------------------------ |
| API controller   | `HealthController` returns 200 + correct body | Vitest            | 1                        |
| Mobile component | `App` renders welcome text                    | Jest + RNTL       | 1                        |
| Lint             | Zero warnings across all workspaces           | ESLint            | CI gate                  |
| Type check       | `tsc --noEmit` passes in every workspace      | TypeScript strict | Pre-commit (lint-staged) |

No integration or E2E tests in this slice. Vitest and Jest configs are minimal — enough to prove the pipeline works. Coverage thresholds deferred.

## Migration / Rollout

No migration required — greenfield. Rollback: delete all created files. Single PR, revert-able.

## Deferred Decisions

| Decision                           | Deferred to                                 | Why                   |
| ---------------------------------- | ------------------------------------------- | --------------------- |
| Turborepo                          | First slice with cross-workspace build deps | No build graph yet    |
| dependency-cruiser / arch lint     | First use case implementation               | No imports to enforce |
| DB provider (SQLite/Postgres)      | Data persistence slice                      | No data in scaffold   |
| React Navigation                   | Multi-screen slice                          | Single screen now     |
| State management (Zustand/Context) | First stateful screen                       | Screen is static      |
| E2E (Detox/Maestro)                | Post-MVP                                    | No navigation flows   |
| Coverage thresholds                | After unit test baseline exists             | Only 2 tests now      |
| Docker / deployment                | Deployment slice                            | Local dev only        |

## Implementation Guardrails

1. **No business logic**: grep for `finnhub`, `fcm`, `alert`, `stock`, `db`, `prisma`, `sqlite`, `postgres`, `offline`, `queue` — must return zero hits in `src/` and `app/` directories.
2. **No extra dependencies**: `pnpm ls -r --depth 0` must show only packages declared in this design. No `@nestjs/typeorm`, `react-navigation`, `zustand`, etc.
3. **Strict mode enforced**: every `tsconfig.json` must have `"strict": true`. Verify with `grep -r '"strict"' **/tsconfig.json`.
4. **No fake layers**: each Clean Architecture directory (`domain/`, `application/`, `infrastructure/`, `interfaces/`) must contain only a `.gitkeep`. Zero imports, zero classes, zero interfaces beyond the health module.
5. **Health endpoint ONLY**: `apps/api/src/` must contain exactly one module (`health/`) and `main.ts`. No other controllers, services, or modules.
6. **Single screen ONLY**: `apps/mobile/app/` (or `src/`) must contain exactly one screen component. No navigation config, no stack, no tabs.
