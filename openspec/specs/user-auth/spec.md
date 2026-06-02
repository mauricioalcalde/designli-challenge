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

### Requirement: Premium Auth Entry

The mobile auth presentation **MUST** use the premium design system, a login-first shell, and splash-driven entry flow while preserving `POST /auth/login`, `POST /auth/register`, auth guards, and auth state semantics. The auth screen **MUST** include keyboard avoidance, password visibility toggle, and inline error presentation.

#### Scenario: Login behavior is preserved

- **GIVEN** valid credentials on the premium auth screen
- **WHEN** the user submits the form
- **THEN** the existing auth flow succeeds without changing request or response contracts

#### Scenario: Splash routes into auth or app shell

- **GIVEN** the app finishes splash bootstrap
- **WHEN** auth state is resolved
- **THEN** unauthenticated users land in auth
- **AND** authenticated users continue into the premium tab shell

#### Scenario: Auth screen keyboard and error quality

- **GIVEN** the auth screen is rendered
- **WHEN** the user interacts with inputs or submits invalid data
- **THEN** keyboard avoidance keeps the form visible
- **AND** errors display inline using design system tokens
- **AND** password visibility is toggleable

### Requirement: Logout Reliability

The `logout()` action **MUST** complete without throwing. `MmkvTokenStorage.clear()` **MUST** call a defined storage method to remove all tokens. The auth store **MUST** transition to unauthenticated state after `logout()` resolves.

#### Scenario: Logout completes without crash

- **GIVEN** the user is authenticated with tokens stored
- **WHEN** `logout()` is called
- **THEN** `MmkvTokenStorage.clear()` removes all token keys without throwing
- **AND** the auth store transitions to `isAuthenticated: false`
- **AND** the navigation shell routes to the auth screen

#### Scenario: Logout when no tokens exist

- **GIVEN** the token storage is already empty
- **WHEN** `logout()` is called
- **THEN** the call resolves without error
- **AND** the auth store remains in unauthenticated state

### Requirement: Auth Shell Quality

The auth screen **MUST** provide keyboard-aware layout, password visibility toggle, inline error states, and clear visual hierarchy between login and register modes.

#### Scenario: Keyboard does not obscure inputs

- **GIVEN** the auth screen is visible on a device with a software keyboard
- **WHEN** the user focuses an input field
- **THEN** the form **MUST** adjust so the focused input and submit button remain visible above the keyboard

#### Scenario: Password visibility toggle

- **GIVEN** the auth screen renders a password input
- **WHEN** the user taps the visibility toggle icon
- **THEN** the password text switches between masked and visible
- **AND** the toggle icon reflects the current state

#### Scenario: Inline validation error display

- **GIVEN** the user submits the auth form with invalid input
- **WHEN** the API returns a 401 or 409 error
- **THEN** the error message renders inline below the relevant field
- **AND** the error uses the design system error color token
- **AND** no alert dialog is shown

#### Scenario: Login/register mode switch

- **GIVEN** the auth screen is in login mode
- **WHEN** the user taps the "switch to register" affordance
- **THEN** the form transitions to register mode
- **AND** the submit button label updates
- **AND** the visual hierarchy clearly indicates the active mode
