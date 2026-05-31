# mobile-api-client Specification

**Layer**: data

## Purpose

HTTP client for all mobile-to-backend communication. Handles auth header injection, error mapping, and 401-triggered logout.

## Requirements

### R1: HTTP Client Boot

The system MUST create an Axios instance with a configurable base URL.

| #   | GIVEN                    | WHEN                    | THEN                                      |
| --- | ------------------------ | ----------------------- | ----------------------------------------- |
| 1.1 | no Axios instance exists | the app initializes     | one MUST be created with the API base URL |
| 1.2 | a base URL is provided   | the instance is created | it MUST NOT append a trailing slash       |

### R2: Auth Endpoints

The system MUST expose `login(dto: LoginDTO): Promise<AuthResponse>` and `register(dto: RegisterDTO): Promise<AuthResponse>`.

| #   | GIVEN                   | WHEN                   | THEN                                        |
| --- | ----------------------- | ---------------------- | ------------------------------------------- |
| 2.1 | valid credentials       | `login()` is called    | POST `/auth/login` with LoginDTO body       |
| 2.2 | invalid credentials     | `login()` is called    | reject with an AuthError                    |
| 2.3 | valid registration data | `register()` is called | POST `/auth/register` with RegisterDTO body |

### R3: Token Injection

The system MUST inject the Bearer token into every request's Authorization header.

| #   | GIVEN                  | WHEN                              | THEN                                               |
| --- | ---------------------- | --------------------------------- | -------------------------------------------------- |
| 3.1 | a stored token exists  | any authenticated request is sent | Authorization header MUST include `Bearer {token}` |
| 3.2 | no stored token exists | any request is sent               | Authorization header MUST be absent                |

### R4: 401 Handling

The system MUST intercept 401 responses, clear the stored token, and emit a logout event.

| #   | GIVEN                   | WHEN                           | THEN                                                   |
| --- | ----------------------- | ------------------------------ | ------------------------------------------------------ |
| 4.1 | any request returns 401 | the response interceptor fires | the token MUST be removed from storage                 |
| 4.2 | a 401 triggers logout   | the token is cleared           | a `LOGGED_OUT` event MUST be emitted to the auth store |

### R5: Error Mapping

The system MUST map HTTP errors to typed ApplicationError objects.

| #   | GIVEN                               | WHEN              | THEN                             |
| --- | ----------------------------------- | ----------------- | -------------------------------- |
| 5.1 | a network failure (no connectivity) | the request fails | the error MUST be a NetworkError |
| 5.2 | a 5xx response                      | the request fails | the error MUST be a ServerError  |
| 5.3 | a 401 response                      | the request fails | the error MUST be an AuthError   |

### R6: Test Expectations

| #   | Test                                   | Expected                                               |
| --- | -------------------------------------- | ------------------------------------------------------ |
| 6.1 | `api-client` constructs Axios instance | base URL matches config                                |
| 6.2 | `login()` calls correct endpoint       | POST to `/auth/login` with LoginDTO                    |
| 6.3 | 401 interceptor clears token           | storage `getItem('auth_token')` returns null after 401 |
