# project-scaffold Specification

## Purpose

Foundation for the designli-challenge monorepo: workspace structure, shared tooling, CI pipeline, and application skeletons for NestJS backend and Expo mobile. No business logic.

## Requirements

### Requirement: PNPM Workspace

The project MUST use PNPM workspaces via root `package.json` and `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`.

- GIVEN a clean checkout with no `node_modules`
- WHEN `pnpm install` runs
- THEN all workspace packages resolve without errors

### Requirement: Backend Health Endpoint

`apps/api` MUST be a NestJS app with `tsconfig.json` setting `strict: true`. It MUST expose `GET /health` returning HTTP 200 `{ "status": "ok" }`.

- GIVEN the NestJS server runs in dev mode
- WHEN a GET request is sent to `/health`
- THEN the server responds HTTP 200 with body `{ "status": "ok" }`

### Requirement: Mobile Welcome Screen

`apps/mobile` MUST be an Expo project with dev builds. It MUST render a single screen displaying "Hello from Designli Challenge".

- GIVEN the Expo dev build is running
- WHEN the app launches
- THEN the welcome screen text is visible

### Requirement: Shared Package

`packages/shared` MUST export via `@designli-challenge/shared` and contain `src/types/` as a placeholder.

- GIVEN the workspace is installed
- WHEN `pnpm -F @designli-challenge/shared exec tsc --noEmit` runs
- THEN type checking passes with zero errors

### Requirement: Lint and Format

Root `package.json` MUST define `lint` and `format` scripts running ESLint and Prettier across all workspaces.

- GIVEN all scaffold files are in place
- WHEN `pnpm lint` runs
- THEN it exits 0 with zero warnings

### Requirement: Pre-commit Hook

The project MUST use Husky with a `pre-commit` hook running `lint-staged`.

- GIVEN staged changes exist
- WHEN `git commit` executes
- THEN Husky runs `lint-staged` and aborts on failure

### Requirement: CI Pipeline

The repo MUST include `.github/workflows/ci.yml` running install, lint, and test on push to `main` and PRs targeting `main`.

- GIVEN a push to `main` (or PR targeting `main`)
- WHEN the workflow triggers
- THEN lint and test run in parallel; success requires both to pass

### Requirement: Architecture Folder Skeleton

| Path               | Directories                                                 |
| ------------------ | ----------------------------------------------------------- |
| `apps/api/src/`    | `domain/`, `application/`, `infrastructure/`, `interfaces/` |
| `apps/mobile/src/` | `components/atoms/`, `screens/`, `navigation/`              |

Each directory MUST contain a `.gitkeep` file.

- GIVEN the scaffold is created
- WHEN inspecting both app source trees
- THEN all layer directories exist with `.gitkeep` files

### Requirement: Strict TypeScript

Every `tsconfig.json` MUST set `"strict": true` in `compilerOptions`.

- GIVEN all tsconfig files in the workspace
- WHEN each is parsed
- THEN `"strict": true` is present in every one

### Requirement: Test Baseline

Each app MUST have one passing test. Backend: health controller returns 200. Mobile: welcome screen renders.

- GIVEN both apps are scaffolded
- WHEN `pnpm -F api test` runs, it passes with exit 0
- AND WHEN `pnpm -F mobile test` runs, it also passes with exit 0

### Requirement: No Business Logic

The scaffold MUST NOT include business logic, DB connections, external API integrations, auth, multi-screen nav, or offline queues.

- GIVEN the scaffold is complete
- WHEN searching all source files
- THEN no references to Finnhub, FCM, alerts, DB drivers, or offline queue exist
