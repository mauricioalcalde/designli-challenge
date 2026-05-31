# Tasks: Backend Auth + Database

## Review Workload Forecast

| Field                   | Value                                                     |
| ----------------------- | --------------------------------------------------------- |
| Estimated changed lines | 460–510                                                   |
| 400-line budget risk    | Medium                                                    |
| Chained PRs recommended | Yes                                                       |
| Suggested split         | PR 1: Foundation→Application; PR 2: Infrastructure→Wiring |
| Delivery strategy       | ask-on-risk                                               |
| Chain strategy          | feature-branch-chain                                      |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal                                                                         | Likely PR                   | Notes                                             |
| ---- | ---------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------- |
| 1    | Deps → Schema → Shared types → Domain → Application + AuthService unit tests | PR 1 (base=feature/auth-db) | Mocked ports only; no infra imports. 5 tests pass |
| 2    | Infrastructure → Interfaces → AppModule wiring + integration tests           | PR 2 (base=PR 1 branch)     | Full wiring. 7+ tests pass. Custom JWT guard      |

### Out of Scope Reminders

- **No passport-jwt** — design ADR chose custom CanActivate + `@nestjs/jwt`
- **No extra Prisma models** — `User` only (no Stock, Alert, etc.)
- **No refresh tokens** — single JWT only; refresh deferred to future change
- **No extra endpoints** — only `POST /auth/register` and `POST /auth/login`
- **No stock/alert/Finnhub/FCM logic** — zero references in this change

## Phase 1: Foundation & Configuration

- [x] 1.1 Add deps to `apps/api/package.json`: `@prisma/client`, `bcrypt`, `@nestjs/jwt`, `@nestjs/config`; devDeps `prisma`, `@types/bcrypt`
- [x] 1.2 Create `apps/api/.env` with `JWT_SECRET=dev-secret-change-in-production`
- [x] 1.3 Create `apps/api/prisma/schema.prisma` — User model only (id, email, passwordHash, createdAt)
- [x] 1.4 Run `pnpm install && npx prisma migrate dev --name init && npx prisma generate` — all done: deps installed, migration applied (`20260528204137_init`), Prisma client generated

## Phase 2: Shared Types

- [x] 2.1 Create `packages/shared/src/types/auth.ts` — export `RegisterDTO`, `LoginDTO`, `AuthResponse`, `JwtPayload`
- [x] 2.2 Modify `packages/shared/src/types/index.ts` — re-export from `./auth`

## Phase 3: Domain Layer (zero infra/framework imports)

- [x] 3.1 Create `apps/api/src/domain/auth/user.entity.ts` — plain class, no decorators
- [x] 3.2 Create `apps/api/src/domain/auth/email.vo.ts` — validates email format, throws DomainError
- [x] 3.3 Create `apps/api/src/domain/auth/password.vo.ts` — validates length ≥6, throws DomainError

## Phase 4: Application Layer

- [x] 4.1 Create 3 port abstract classes in `application/auth/ports/`: `IUserRepository`, `ITokenService`, `IPasswordHasher`
- [x] 4.2 Create `apps/api/src/application/auth/auth.service.ts` — `register()` and `login()` orchestrating ports via abstract DI tokens
- [x] 4.3 Create `apps/api/src/application/auth/auth.service.spec.ts` — 5 unit tests with mocked ports (register success, duplicate email, login success, wrong password, unknown email) — 7 tests implemented (includes email/password validation edge cases)

## Phase 5: Infrastructure Layer

- [x] 5.1 Create `apps/api/src/infrastructure/database/prisma.service.ts` — `PrismaClient` singleton, `OnModuleInit`
- [x] 5.2 Create `apps/api/src/infrastructure/auth/prisma-user.repository.ts` — implements `IUserRepository` via PrismaService
- [x] 5.3 Create `apps/api/src/infrastructure/auth/jwt-token.service.ts` — implements `ITokenService` via `JwtService` (`@nestjs/jwt`)
- [x] 5.4 Create `apps/api/src/infrastructure/auth/bcrypt-password.hasher.ts` — implements `IPasswordHasher` via bcrypt
- [x] 5.5 Create `apps/api/src/infrastructure/auth/jwt-auth.guard.ts` — custom `CanActivate` (NOT passport-jwt)

## Phase 6: Interfaces & Wiring

- [x] 6.1 Create `apps/api/src/interfaces/auth/auth.controller.ts` — `POST /auth/register`, `POST /auth/login`
- [x] 6.2 Create `apps/api/src/interfaces/auth/auth.module.ts` — module wiring 4 providers + `JwtModule.registerAsync`
- [x] 6.3 Modify `apps/api/src/app.module.ts` — import `ConfigModule.forRoot({ isGlobal: true })` + `AuthModule`
- [x] 6.4 Create `apps/api/src/interfaces/auth/auth.controller.spec.ts` — integration tests (register 201, guard 401)

## Verification

- After Phase 1: `npx prisma validate` passes; User table exists in SQLite
- After Phase 4: `pnpm -F api test` passes 5 AuthService unit tests
- After Phase 6: `pnpm -F api test` passes 7+ tests covering all spec scenarios
- Final: `pnpm lint` clean; `grep -r '@nestjs/passport\|passport-jwt' apps/api/src` returns zero hits; domain/ has no infra imports
