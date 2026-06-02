# Alerts Specification

## Purpose

Alert CRUD with user scoping, idempotent creation, threshold-crossing evaluation, and duplicate-trigger prevention. Core business logic for price monitoring.

## Requirements

### Requirement: Shared Contracts

`packages/shared/src/types/alert.ts` **MUST** export `CreateAlertDTO`, `AlertResponse`, `AlertDirection`, and `AlertStatus` as TypeScript types.

- GIVEN the shared package is installed
- WHEN importing `CreateAlertDTO`, `AlertResponse`, `AlertDirection`, and `AlertStatus` from `@designli-challenge/shared`
- THEN all four types resolve and type-check without errors

### Requirement: Alert Creation (Idempotent)

`POST /alerts` **MUST** accept `{ symbol, threshold, direction }` and an `Idempotency-Key` header. On first use it **MUST** return HTTP 201 and create the alert. A duplicate `Idempotency-Key` **MUST** return HTTP 409 without creating a duplicate. The endpoint **MUST** be protected by `JwtAuthGuard`.

- GIVEN a valid JWT and `Idempotency-Key: abc-123`
- WHEN POST /alerts is called with `{ symbol: "AAPL", threshold: 180, direction: "above" }`
- THEN the response is HTTP 201 with body containing the created alert scoped to the authenticated user

- GIVEN an alert was already created with `Idempotency-Key: abc-123`
- WHEN POST /alerts is called again with the same key
- THEN the response is HTTP 409 Conflict

### Requirement: Alert List (User-Scoped)

`GET /alerts` **MUST** return only the authenticated user's alerts. **MUST** be protected by `JwtAuthGuard`.

- GIVEN a user with 3 created alerts
- WHEN GET /alerts is called with a valid token
- THEN the response is HTTP 200 with an array of the user's alerts

- GIVEN two users each have alerts
- WHEN user A calls GET /alerts
- THEN user B's alerts are not returned

### Requirement: Alert Deletion (User-Scoped)

`DELETE /alerts/:id` **MUST** delete the alert only if it belongs to the authenticated user. **MUST** return HTTP 204 on success, HTTP 404 if not found or not owned.

- GIVEN an alert owned by the authenticated user
- WHEN DELETE /alerts/1 is called
- THEN the response is HTTP 204 and the alert is removed

- GIVEN an alert owned by a different user
- WHEN DELETE /alerts/1 is called
- THEN the response is HTTP 404

### Requirement: Alert Evaluator

A scheduled job **MUST** periodically evaluate all active alerts. For each alert where the current price crosses the threshold in the configured direction, the evaluator **MUST** call the notification port to dispatch a trigger.

- GIVEN an active alert with symbol "AAPL", threshold 180, direction "above" and current price 185
- WHEN the evaluator runs
- THEN the notification port is called with a trigger payload for that alert

- GIVEN an active alert where the current price is 170 and threshold is 180 (direction "above")
- WHEN the evaluator runs
- THEN the notification port is NOT called

### Requirement: Duplicate-Trigger Prevention

The evaluator **MUST** enforce a cooldown window (default 5 minutes) per alert. If a trigger was already dispatched within the window, the evaluator **SHOULD** skip dispatching again.

- GIVEN an alert was triggered 2 minutes ago
- WHEN the evaluator runs and the price still crosses the threshold
- THEN no additional trigger is dispatched

- GIVEN an alert was triggered 6 minutes ago
- WHEN the evaluator runs and the price still crosses the threshold
- THEN a new trigger is dispatched

### Requirement: Alerts Test Suite

The system **MUST** include ≥5 passing tests covering alert creation (idempotency), user scoping, evaluator threshold crossing, and duplicate-trigger prevention.

- GIVEN the API workspace is set up
- WHEN `pnpm -F api test` runs
- THEN ≥5 tests pass covering alert CRUD, evaluator, and cooldown logic

### Requirement: Split Alerts Flow

The mobile presentation **MUST** separate alert creation from alert listing, preserve existing alert behavior, and represent `Active`, `Triggered`, `Pending sync`, offline-save, retry, and failure states with shared premium primitives.

#### Scenario: Offline alert creation

- **GIVEN** the device is offline
- **WHEN** the user creates a valid alert
- **THEN** the UI confirms the alert was saved locally for later sync
- **AND** the alert is marked `Pending sync`

#### Scenario: Alerts list and create are separate surfaces

- **GIVEN** the user is inside the Alerts flow
- **WHEN** they browse existing alerts or start a new one
- **THEN** listing and creation are presented on separate screens
- **AND** both screens preserve existing alert contracts
