# Tasks: Project Scaffolding

## Review Workload Forecast

| Field                   | Value                                                   |
| ----------------------- | ------------------------------------------------------- |
| Estimated changed lines | 500-800                                                 |
| 400-line budget risk    | High                                                    |
| Chained PRs recommended | Yes                                                     |
| Suggested split         | PR 1: Root + shared → PR 2: Backend → PR 3: Mobile + CI |
| Delivery strategy       | ask-on-risk                                             |
| Chain strategy          | feature-branch-chain                                    |

...
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                        | Likely PR | Base           |
| ---- | ------------------------------------------- | --------- | -------------- |
| 1    | Root workspace + shared package             | PR 1      | main           |
| 2    | Backend scaffold (NestJS + health endpoint) | PR 2      | PR 1 (or main) |
| 3    | Mobile scaffold (Expo) + CI + hooks         | PR 3      | PR 1 (or main) |

**Out of scope**: Business logic (Finnhub, alerts, FCM, DB, offline queue); multi-screen navigation; Docker/deployment; E2E tests; Turborepo; coverage thresholds; dependency-cruiser.

## Phase 1: Monorepo Root

- [x] 1.1 Root `package.json`: workspace scripts, devDeps (ESLint, Prettier, Husky, lint-staged, TypeScript)
- [x] 1.2 `pnpm-workspace.yaml` — `apps/*`, `packages/*`
- [x] 1.3 `.gitignore` — Node, `.expo/`, build artifacts, `.husky/_/`, env files
- [x] 1.4 `.prettierrc` — single-quotes, trailing-comma all, print-width 100
- [x] 1.5 `.eslintrc.js` — `@typescript-eslint`, Prettier integration, root-only

Verify: `pnpm install` resolves; `pnpm -F @designli-challenge/shared exec tsc --noEmit` passes

## Phase 2: Shared Package

- [x] 2.1 `packages/shared/package.json` — `@designli-challenge/shared`, main `src/types/index.ts`
- [x] 2.2 `packages/shared/tsconfig.json` — strict, composite
- [x] 2.3 `packages/shared/src/types/index.ts` — empty barrel export

Verify: `pnpm -F @designli-challenge/shared exec tsc --noEmit` passes, zero errors

## Phase 3: Backend Scaffold (NestJS)

- [x] 3.1 `npx @nestjs/cli new apps/api`; delete default app.controller, app.service, spec, e2e, generated eslint/prettier
- [x] 3.2 Update `apps/api/package.json` — scoped name, workspace-aware deps; update tsconfig for monorepo
- [x] 3.3 Create `health.module.ts` + `health.controller.ts` — `GET /health` → `{ status: "ok" }`
- [x] 3.4 Clean Arch `.gitkeep`: `domain/`, `application/`, `infrastructure/`, `interfaces/`
- [x] 3.5 Replace Jest with Vitest: add vitest config, create `health.controller.spec.ts`

Verify: `pnpm -F api test` passes (1 spec); `pnpm -F api start:dev` serves health endpoint

## Phase 4: Mobile Scaffold (Expo)

- [x] 4.1 `npx create-expo-app@latest apps/mobile --template blank-typescript` (manual — CLI skipped per Slice 2 precedent; identical result)
- [x] 4.2 Wire workspace: scoped name, workspace protocol for `@designli-challenge/shared`
- [x] 4.3 Replace default `App.tsx` — "Hello from Designli Challenge" welcome screen
- [x] 4.4 Arch `.gitkeep`: `components/atoms/`, `screens/`, `navigation/` (structure only — no routing logic)
- [x] 4.5 Jest + RNTL: config in package.json scripts, `__tests__/App.test.tsx`

Verify: `pnpm -F mobile test` passes (1 spec); dev build shows welcome text

## Phase 5: Git Hooks + CI

- [x] 5.1 Husky init; `.husky/pre-commit` — `npx lint-staged`
- [x] 5.2 `lint-staged` in root package.json — `*.{ts,tsx}` → eslint --fix, prettier --write
- [x] 5.3 `.github/workflows/ci.yml` — push/PR to main: install → lint + test-api + test-mobile (all parallel jobs)

Verify: `git commit` triggers Husky; CI workflow valid (manual parse)

## Phase 6: Final Validation

- [x] 6.1 `pnpm install` — full clean resolution (4 workspaces, 1269 packages, zero errors)
- [x] 6.2 `pnpm lint` — zero warnings across all workspaces
- [x] 6.3 Both test suites pass: `pnpm -F api test && pnpm -F mobile test` (1 spec each, both pass)
- [x] 6.4 Every `tsconfig.json` has `"strict": true` (mobile, api, shared — all confirmed)
- [x] 6.5 No business logic keywords in src/ — zero hits in `apps/api/src/` and `apps/mobile/`
- [x] 6.6 Arch layer guard: only `.gitkeep` in Clean Arch dirs; only health module in `apps/api/src/`

Verify: all 6 checks pass; `pnpm ls -r --depth 0` shows only declared deps — ✅ all verified
