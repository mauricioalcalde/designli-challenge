# Proposal: Backend Auth + Database

## Intent

Auth gates every backend feature — no identity means no per-user data, no protected endpoints, no mobile login. Database must exist before data work. This change replaces scaffold `.gitkeep` files with real Clean Architecture code, establishing the pattern for all future slices.

## Scope

### In Scope

- Prisma + SQLite with User model
- Shared types: RegisterDTO, LoginDTO, AuthResponse, JwtPayload
- Domain: User entity, Email VO, Password VO
- Application: AuthService (register, login), 3 port interfaces
- Infrastructure: PrismaUserRepository, JwtTokenService, BcryptPasswordHasher
- Interfaces: AuthController, JwtAuthGuard
- Tests: AuthService unit, AuthController int, JwtAuthGuard (401)
- Fix scaffold WARNING: add `@designli-challenge/shared` to API deps

### Out of Scope

Stocks, charts, Finnhub, alerts, FCM, mobile, offline queue, Docker, refresh tokens.

## Capabilities

| Type     | Name               | Description                                        |
| -------- | ------------------ | -------------------------------------------------- |
| New      | `user-auth`        | Register, login, JWT, route guard                  |
| Modified | `project-scaffold` | API must declare shared dep (no behavioral change) |

## Approach

Install Prisma + SQLite. Inward-out: Domain (User, Email, Password) → Application (AuthService + ports) → Infrastructure (Prisma repo, JWT, Bcrypt) → Interfaces (AuthController, JwtAuthGuard via passport-jwt). Shared types in `packages/shared`. Module in root `AppModule`.

## Affected Areas

`apps/api/package.json` (mod), `apps/api/prisma/schema.prisma` (new), `apps/api/src/domain/` (new), `apps/api/src/application/` (new), `apps/api/src/infrastructure/` (new), `apps/api/src/interfaces/` (new), `packages/shared/src/types/auth.ts` (new).

## Risks

| Risk                             | Likelihood | Mitigation                                              |
| -------------------------------- | ---------- | ------------------------------------------------------- |
| Passport boilerplate inflates PR | Med        | NestJS abstracts ceremony; `ask-on-risk` delivery       |
| PR over 400 lines                | Med        | Bundle tests with their implementation. Chain if needed |

## Rollback Plan

Revert PR. Delete `dev.db` + `prisma/migrations/`. `pnpm -F api remove` added packages. Zero impact on mobile/shared.

## Dependencies

`prisma` (dev), `@prisma/client`, `bcrypt`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/config`, `@types/bcrypt` + `@types/passport-jwt` (dev).

## Success Criteria

- [ ] `pnpm -F api test` passes (≥3 tests)
- [ ] `POST /auth/register` → 201 + `{ token, user }`
- [ ] `POST /auth/login` (valid) → 200 + JWT
- [ ] Duplicate email → 409
- [ ] Wrong password → 401
- [ ] Protected route without token → 401
- [ ] `domain/` has real files (no .gitkeep)
- [ ] `packages/shared/src/types/auth.ts` exports 4 DTOs
- [ ] Prisma migration creates User table
- [ ] `pnpm lint` zero warnings
- [ ] `apps/api/package.json` has `@designli-challenge/shared`
