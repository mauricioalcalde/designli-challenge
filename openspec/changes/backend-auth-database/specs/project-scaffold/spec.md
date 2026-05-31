# Delta for project-scaffold

## ADDED Requirements

### Requirement: API Declares Shared Dependency

`apps/api/package.json` **MUST** include `@designli-challenge/shared` as a workspace dependency.

- GIVEN the API workspace is installed
- WHEN inspecting `apps/api/package.json` dependencies
- THEN `"@designli-challenge/shared": "workspace:*"` is present

## MODIFIED Requirements

### Requirement: Shared Package

`packages/shared` **MUST** export via `@designli-challenge/shared` and contain `src/types/` with TypeScript type definitions for the application. `src/types/auth.ts` **MUST** export `RegisterDTO`, `LoginDTO`, `AuthResponse`, and `JwtPayload`.
(Previously: placeholder directory with no real exports)

- GIVEN the workspace is installed
- WHEN `pnpm -F @designli-challenge/shared exec tsc --noEmit` runs
- THEN type checking passes with zero errors

- GIVEN the shared package is built
- WHEN importing from `@designli-challenge/shared`
- THEN `RegisterDTO`, `LoginDTO`, `AuthResponse`, and `JwtPayload` are available
