# user-auth Specification

## Purpose

User registration, login, JWT issuance, and route guard. Establishes the Clean Architecture auth pattern for all protected endpoints.

## Requirements

### Requirement: User Registration

`POST /auth/register` **MUST** accept `{ email, password }`, hash the password with bcrypt, persist the user to SQLite via Prisma, and return HTTP 201 with `{ token, user }`. Duplicate email **MUST** return HTTP 409.

- GIVEN an unregistered email with valid format and password ≥6 characters
- WHEN POST /auth/register is called with `{ email, password }`
- THEN the response is HTTP 201 with body containing `token` (JWT string) and `user: { id, email }`

- GIVEN an email already registered
- WHEN POST /auth/register is called with the same email
- THEN the response is HTTP 409 Conflict

### Requirement: User Login

`POST /auth/login` **MUST** verify credentials and return HTTP 200 with `{ token, user }` on success. Invalid credentials **MUST** return HTTP 401.

- GIVEN a registered user with known password
- WHEN POST /auth/login is called with the correct email and password
- THEN the response is HTTP 200 with body containing `token` and `user`

- GIVEN a registered user
- WHEN POST /auth/login is called with an incorrect password
- THEN the response is HTTP 401

- GIVEN an email with no associated account
- WHEN POST /auth/login is called
- THEN the response is HTTP 401

### Requirement: Route Guard

The system **MUST** provide a `JwtAuthGuard` that validates Bearer tokens. Missing or invalid tokens **MUST** return HTTP 401.

- GIVEN a route decorated with `@UseGuards(JwtAuthGuard)`
- WHEN a request is sent without an Authorization header
- THEN the response is HTTP 401

- GIVEN the same route
- WHEN a request is sent with a valid JWT Bearer token
- THEN the request passes through to the handler

### Requirement: Auth Types

`packages/shared/src/types/auth.ts` **MUST** export `RegisterDTO`, `LoginDTO`, `AuthResponse`, and `JwtPayload` as TypeScript types or interfaces.

- GIVEN the shared package is installed
- WHEN importing `RegisterDTO`, `LoginDTO`, `AuthResponse`, and `JwtPayload` from `@designli-challenge/shared`
- THEN all four types resolve and type-check without errors

### Requirement: Layer Boundaries

Domain entities and value objects **MUST** reside in `domain/` with zero imports from infrastructure or framework libraries. Application port interfaces **MUST** be defined in `application/` and implemented by `infrastructure/`.

- GIVEN the auth module is implemented
- WHEN inspecting all imports in `domain/` files
- THEN no imports from Prisma, bcrypt, JWT, or NestJS exist

- GIVEN the auth module is implemented
- WHEN inspecting all imports in `application/` files (excluding port interface declarations)
- THEN no imports from `infrastructure/` exist

### Requirement: User Persistence

The system **MUST** persist users in SQLite via Prisma with a `User` model containing `id` (auto-increment), `email` (unique), `passwordHash`, and `createdAt`.

- GIVEN the Prisma migration has been applied
- WHEN inspecting the database schema
- THEN a `User` table exists with columns id, email, passwordHash, createdAt

### Requirement: Auth Test Suite

The system **MUST** include ≥3 passing tests covering AuthService, AuthController, and JwtAuthGuard.

- GIVEN the API workspace is set up
- WHEN `pnpm -F api test` runs
- THEN ≥3 tests pass covering register, login, duplicate email, wrong password, and missing token scenarios
