# mobile-auth Specification

**Layer**: domain, application, data, presentation

## Purpose

Authentication state management, token persistence, login use case, and login screen behavior.

## Requirements

### R1: Auth Repository Port (domain)

The system MUST define an abstract port `AuthRepository` with `login(dto): Promise<AuthResponse>` and `register(dto): Promise<AuthResponse>` in `src/domain/`.

| #   | GIVEN                | WHEN                          | THEN                                       |
| --- | -------------------- | ----------------------------- | ------------------------------------------ |
| 1.1 | the port is defined  | any implementation is created | it MUST implement `login` and `register`   |
| 1.2 | the port is consumed | the auth store calls it       | domain/ MUST NOT import data-layer modules |

### R2: Token Storage Port (domain)

The system MUST define an abstract port `TokenStorage` with `get(): Promise<string|null>`, `set(token): Promise<void>`, `clear(): Promise<void>` in `src/domain/`.

### R3: Auth Store (application)

The system MUST expose a Zustand store with `{ isAuthenticated, isLoading, error, login(email, password), logout(), bootstrap() }`.

| #   | GIVEN                                | WHEN                         | THEN                                                                   |
| --- | ------------------------------------ | ---------------------------- | ---------------------------------------------------------------------- |
| 3.1 | `bootstrap()` resolves with a token  | the app starts               | `isAuthenticated` MUST be true                                         |
| 3.2 | `bootstrap()` resolves with no token | the app starts               | `isAuthenticated` MUST be false                                        |
| 3.3 | `login()` succeeds                   | the API returns AuthResponse | `isAuthenticated` MUST be true AND the token MUST be persisted         |
| 3.4 | `login()` fails (401)                | the API returns an error     | `isAuthenticated` MUST stay false AND `error` MUST reflect the failure |
| 3.5 | `logout()` is called                 | the user is authenticated    | `isAuthenticated` MUST be false AND the token MUST be cleared          |

### R4: Token Persistence via MMKV (data)

The system MUST use MMKV under `TokenStorage` to persist the JWT with key `auth_token`.

| #   | GIVEN                   | WHEN                 | THEN                                        |
| --- | ----------------------- | -------------------- | ------------------------------------------- |
| 4.1 | a token is saved        | the app cold-starts  | `bootstrap()` MUST read it from MMKV        |
| 4.2 | `logout()` or 401 fires | the token is cleared | the MMKV entry `auth_token` MUST be removed |

### R5: Login Screen (presentation)

The login screen MUST render email/password inputs, a submit button, and three visual states: loading, error, and success.

| #   | GIVEN                     | WHEN                           | THEN                                                            |
| --- | ------------------------- | ------------------------------ | --------------------------------------------------------------- |
| 5.1 | the form is pristine      | the screen renders             | the submit button MUST be enabled                               |
| 5.2 | email is empty or invalid | the user taps submit           | field-level validation MUST block submission                    |
| 5.3 | login is in-flight        | the user taps submit           | the submit button MUST show a loading indicator AND be disabled |
| 5.4 | login fails               | the API returns an error       | an error message MUST be displayed below the form               |
| 5.5 | login succeeds            | `isAuthenticated` becomes true | the screen SHOULD trigger navigation to MainTabs                |

### R6: Test Expectations

| #   | Test                            | Expected                                                        |
| --- | ------------------------------- | --------------------------------------------------------------- |
| 6.1 | login with valid credentials    | Zustand `isAuthenticated` becomes true, token persisted to MMKV |
| 6.2 | login with invalid credentials  | Zustand `error` is set, `isAuthenticated` remains false         |
| 6.3 | cold start with stored token    | `bootstrap()` sets `isAuthenticated` to true                    |
| 6.4 | cold start without stored token | `bootstrap()` sets `isAuthenticated` to false                   |
| 6.5 | logout clears everything        | `isAuthenticated` false, MMKV `auth_token` null                 |
