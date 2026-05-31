# Proposal: Project Scaffolding

## Intent

Greenfield repo needs a foundation. This change creates the monorepo workspace, shared tooling baseline, and both application skeletons so all future work starts from a consistent, professional setup. Without it, each change would renegotiate tooling decisions, wasting review attention.

## Scope

**In scope**: PNPM workspace; NestJS + strict TypeScript backend (`GET /health`); Expo dev build mobile (Hello screen); `packages/shared` types package; ESLint + Prettier + Husky (root config); Vitest + Jest/RNTL (one passing test each); GitHub Actions CI (lint + test); strict TypeScript everywhere; Clean Architecture folder skeleton with `.gitkeep` files.

**Out of scope**: Business logic (Finnhub, alerts, FCM handlers); database setup; multi-screen navigation; offline queue; Docker/deployment; E2E tests (Detox/Maestro).

## Capabilities

**New**: `project-scaffold` — all workspace foundation, shared tooling, CI pipeline, and both app skeletons.
**Modified**: None (greenfield — no existing specs).

## Approach

PNPM workspace at root. **NestJS** in `apps/api` using `@nestjs/cli`: Controllers → interfaces layer, Services → application use cases, Repository interfaces → ports layer. Mobile via `expo init` with dev builds (`expo-dev-client`). `packages/shared` as bare TS workspace referenced via PNPM workspace protocol. Root ESLint/Prettier config extends per workspace. Husky runs lint-staged on pre-commit. GitHub Actions runs lint + test in parallel on push/PR. Delivery strategy: **single PR** under 400 lines.

## Affected Areas

| Area               | Impact | Key Files                                                                                                                        |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Root               | New    | `package.json`, `pnpm-workspace.yaml`, `.eslintrc`, `.prettierrc`, `.gitignore`, `.husky/pre-commit`, `.github/workflows/ci.yml` |
| `apps/api/`        | New    | NestJS skeleton, health module, `GET /health` route                                                                              |
| `apps/mobile/`     | New    | Expo dev build, single welcome screen                                                                                            |
| `packages/shared/` | New    | Bare TS package with `tsconfig.json`, empty `src/types/`                                                                         |

## Risks

| Risk                                            | Likelihood | Mitigation                                                                               |
| ----------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| NestJS boilerplate inflates PR beyond 400 lines | Med        | Health route only; defer all business logic; use `@nestjs/cli` to generate minimal files |
| PNPM workspace version drift (shared TS/ESLint) | Low        | Pin shared dependencies in root `package.json` via `-w` flag                             |
| Expo dev build fails on first CI run            | Med        | Validate locally before PR; `.gitignore` build artifacts; defer EAS to next slice        |

## Rollback Plan

Delete all created files via `git clean -fd` and restore root to empty state. This is pure creation — zero existing code to break. Rollback: no-merge or revert the single PR.

## Dependencies

- PNPM >=8, Node >=18
- NestJS CLI (`npx @nestjs/cli`)
- Expo CLI + EAS account (free tier sufficient)

## Success Criteria

- [ ] `pnpm install` resolves all workspaces without errors
- [ ] `pnpm -F api start:dev` serves `GET /health` returning `{ status: "ok" }`
- [ ] `pnpm -F mobile start` launches Expo dev client with a single welcome screen
- [ ] `pnpm -F api test` passes exactly 1 test (health controller spec)
- [ ] `pnpm -F mobile test` passes exactly 1 test (App component render)
- [ ] `pnpm lint` passes across all workspaces with zero warnings
- [ ] GitHub Actions CI runs lint + test on push
- [ ] Every `tsconfig.json` has `strict: true`
- [ ] Folder skeleton exists with `domain/`, `application/`, `infrastructure/`, `interfaces/` layers (in `apps/api`), and `components/atoms/`, `screens/`, `navigation/` (in `apps/mobile`)
