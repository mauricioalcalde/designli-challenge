# Design: Backend Auth + Database

## Technical Approach

Replace `.gitkeep` placeholders with Clean Architecture auth using NestJS + Prisma + SQLite + JWT. Build inward from domain → application → infrastructure → interfaces. Single auth module establishes the pattern for all future slices. Shared types in `packages/shared/src/types/auth.ts` consumed by API via workspace protocol.

## Architecture Decisions

| Decision                | Choice                                        | Rejected                            | Rationale                                                                                                         |
| ----------------------- | --------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **JWT guard**           | Custom `CanActivate` + `@nestjs/jwt`          | `@nestjs/passport` + `passport-jwt` | 2 fewer deps, no strategy ceremony, 30-line guard. Swap via `ITokenService` port if OAuth ever needed             |
| **DI tokens**           | Abstract classes in `application/auth/ports/` | String/symbol tokens                | Type-safe, discoverable, NestJS DI compatible. Abstract class lives in application layer (zero framework imports) |
| **Prisma client**       | `PrismaService` provider (`OnModuleInit`)     | Inline `new PrismaClient()`         | Singleton via DI, testable with `prisma.$transaction` mocking, standard NestJS pattern                            |
| **Password validation** | Domain VOs (`Email`, `Password`)              | `class-validator` DTOs              | No extra packages. VOs throw domain errors; controllers map to HTTP exceptions                                    |
| **Config**              | `@nestjs/config` + `.env` for `JWT_SECRET`    | Hardcoded secret                    | Needed for Finnhub keys later anyway. One `.env` key now                                                          |
| **Only User model now** | Prisma schema with only `User`                | Users + tables for future slices    | Schema grows with feature slices. No premature modeling. Only model needed for auth                               |

## Data Flow

```
POST /auth/register
  │ RegisterDTO { email, password }
  ▼
AuthController ──► AuthService
                    │ Email.create(email)       // domain VO
                    │ Password.create(password)  // domain VO
                    │ IUserRepository.findByEmail(email)
                    │   ├─ found → 409 Conflict
                    │   └─ not found ↓
                    │ IPasswordHasher.hash(password) → hash
                    │ IUserRepository.save(user) → User persisted
                    │ ITokenService.sign(user) → JWT
                    ▼
                    { token, user: { id, email } }
  ◄── 201 { token, user }

POST /auth/login
  { email, password } ──► findByEmail → not found? → 401
                                       → found? → IPasswordHasher.compare(password, hash)
                                                    ├─ false → 401
                                                    └─ true → ITokenService.sign(user) → 200 { token, user }

Protected route + JwtAuthGuard
  Authorization: Bearer <token> ──► extract token
                                    ├─ missing → 401
                                    └─ present → ITokenService.verify(token)
                                                   ├─ invalid/expired → 401
                                                   └─ valid → attach payload to request.user → pass
```

## Prisma Schema

```prisma
datasource db { provider = "sqlite"; url = "file:./dev.db" }
generator client { provider = "prisma-client-js" }

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}
```

No other models. Future slices add their own tables via new migrations.

## File Changes

| File                                                          | Action | Description                                                                                               |
| ------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `apps/api/package.json`                                       | Modify | Add deps: `@prisma/client`, `bcrypt`, `@nestjs/jwt`, `@nestjs/config`; devDeps: `prisma`, `@types/bcrypt` |
| `apps/api/.env`                                               | Create | `JWT_SECRET=dev-secret-change-in-production`                                                              |
| `apps/api/prisma/schema.prisma`                               | Create | User model (see above)                                                                                    |
| `packages/shared/src/types/auth.ts`                           | Create | Export `RegisterDTO`, `LoginDTO`, `AuthResponse`, `JwtPayload`                                            |
| `packages/shared/src/types/index.ts`                          | Modify | Re-export from `./auth`                                                                                   |
| `apps/api/src/domain/auth/user.entity.ts`                     | Create | Plain class: id, email, passwordHash, createdAt                                                           |
| `apps/api/src/domain/auth/email.vo.ts`                        | Create | Value object: validates format, throws on invalid                                                         |
| `apps/api/src/domain/auth/password.vo.ts`                     | Create | Value object: validates length ≥6, throws on invalid                                                      |
| `apps/api/src/application/auth/ports/user-repository.port.ts` | Create | Abstract class `IUserRepository`: `findByEmail`, `save`                                                   |
| `apps/api/src/application/auth/ports/token-service.port.ts`   | Create | Abstract class `ITokenService`: `sign`, `verify`                                                          |
| `apps/api/src/application/auth/ports/password-hasher.port.ts` | Create | Abstract class `IPasswordHasher`: `hash`, `compare`                                                       |
| `apps/api/src/application/auth/auth.service.ts`               | Create | `register(dto)`, `login(dto)` — orchestrates ports + domain                                               |
| `apps/api/src/application/auth/auth.service.spec.ts`          | Create | 5 unit tests with mocked ports                                                                            |
| `apps/api/src/infrastructure/database/prisma.service.ts`      | Create | `extends PrismaClient, OnModuleInit`                                                                      |
| `apps/api/src/infrastructure/auth/prisma-user.repository.ts`  | Create | Implements `IUserRepository` via `PrismaService`                                                          |
| `apps/api/src/infrastructure/auth/jwt-token.service.ts`       | Create | Implements `ITokenService` via `JwtService` from `@nestjs/jwt`                                            |
| `apps/api/src/infrastructure/auth/bcrypt-password.hasher.ts`  | Create | Implements `IPasswordHasher` via `bcrypt`                                                                 |
| `apps/api/src/infrastructure/auth/jwt-auth.guard.ts`          | Create | `CanActivate`: extracts Bearer token, verifies via `ITokenService`                                        |
| `apps/api/src/interfaces/auth/auth.controller.ts`             | Create | `POST /auth/register`, `POST /auth/login`                                                                 |
| `apps/api/src/interfaces/auth/auth.module.ts`                 | Create | NestJS module wiring: controller + 4 providers + `JwtModule.registerAsync`                                |
| `apps/api/src/interfaces/auth/auth.controller.spec.ts`        | Create | Integration tests via `Test.createTestingModule`                                                          |
| `apps/api/src/app.module.ts`                                  | Modify | Import `ConfigModule.forRoot({ isGlobal: true })` + `AuthModule`                                          |

## Testing Strategy

| Layer              | What                                   | Count | Approach                                            |
| ------------------ | -------------------------------------- | ----- | --------------------------------------------------- |
| Unit (application) | `AuthService.register` success         | 1     | Mock all 3 ports. Assert returned token + user      |
| Unit (application) | `AuthService.register` duplicate email | 1     | Mock `findByEmail` returning user → expect 409      |
| Unit (application) | `AuthService.login` success            | 1     | Mock valid credentials → expect token               |
| Unit (application) | `AuthService.login` wrong password     | 1     | Mock `compare` false → expect 401                   |
| Unit (application) | `AuthService.login` unknown email      | 1     | Mock `findByEmail` null → expect 401                |
| Integration        | `POST /auth/register` → 201            | 1     | Real `Test.createTestingModule`, mock PrismaService |
| Integration        | Guard returns 401 without token        | 1     | Test controller with `@UseGuards(JwtAuthGuard)`     |

≥7 tests. Runner: Vitest (already configured). No E2E in this slice.

## Command Flow

```bash
pnpm -F @designli-challenge/api add @prisma/client bcrypt @nestjs/jwt @nestjs/config
pnpm -F @designli-challenge/api add -D prisma @types/bcrypt
# Create schema + .env, then:
pnpm -F @designli-challenge/api exec prisma migrate dev --name init
pnpm -F @designli-challenge/api exec prisma generate
pnpm -F @designli-challenge/api test
pnpm lint
```

## Guardrails

1. **Domain purity**: `domain/` files MUST NOT import from NestJS, Prisma, bcrypt, or `@nestjs/jwt`. Verified by grep.
2. **Port inversion**: `application/` files (excluding port abstract classes) MUST NOT import from `infrastructure/`. Dependency flows inward.
3. **No passport**: Zero references to `@nestjs/passport`, `passport`, `passport-jwt` in any file.
4. **No extra models**: Prisma schema contains ONLY `User`. No `Stock`, `Alert`, `Device`, `Notification` tables.
5. **No extra endpoints**: Only `POST /auth/register` and `POST /auth/login`. No `/me`, `/refresh`, `/logout`.
6. **No refresh tokens**: Single short-lived JWT only. Refresh tokens deferred to a future change.
7. **No business logic**: Zero references to `finnhub`, `fcm`, `alert`, `stock`, `chart`, `offline`, `queue` in `apps/api/src/`.
8. **PR budget**: ~450-500 new lines + ~10 modified. Single PR, but notify if exceeds 400-line budget.
