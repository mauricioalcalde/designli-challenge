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

### Requirement: Direction-State Tracking

The evaluator **MUST** track `lastNotifiedDirection` (`'above' | 'below' | null`) per alert. On evaluation, an alert **SHALL** fire only when `lastNotifiedDirection` differs from the alert's configured direction AND the current price crosses the threshold in that direction. After firing, `lastNotifiedDirection` **MUST** be set to the alert's direction. When price crosses back across the threshold in the opposite direction, `lastNotifiedDirection` **MUST** reset to `null`. A first-ever evaluation (`lastNotifiedDirection` is `null`) **MUST** fire if the threshold condition is met.

- GIVEN an alert with null `lastNotifiedDirection`
- WHEN price crosses the threshold in the alert's direction
- THEN the evaluator fires AND sets `lastNotifiedDirection` to the alert's direction

- GIVEN `lastNotifiedDirection` matches the alert's configured direction
- WHEN the evaluator runs and the price still crosses the threshold
- THEN no additional trigger is dispatched (state-transition prevention)

- GIVEN `lastNotifiedDirection` is "above"
- WHEN the price drops below the threshold
- THEN `lastNotifiedDirection` resets to `null`

- GIVEN `lastNotifiedDirection` reset to `null` after a reverse crossing
- WHEN price crosses the threshold again in the alert's direction
- THEN the evaluator fires again

### Requirement: Duplicate-Trigger Prevention (Updated)

The evaluator **MUST** use state-transition tracking as the primary dedup mechanism. An alert **SHALL** fire only when `lastNotifiedDirection` differs from the alert's configured direction AND price crosses the threshold. A cooldown window (default 5 minutes) **SHALL** remain as a secondary noise-guard to prevent rapid re-fires during threshold oscillation.

- GIVEN `lastNotifiedDirection` matches the alert direction
- WHEN the evaluator runs and the price still crosses the threshold
- THEN no additional trigger is dispatched (state-transition prevents re-fire)

- GIVEN `lastNotifiedDirection` was reset to null AND the cooldown is still active
- WHEN the evaluator runs and the price crosses the threshold again
- THEN no additional trigger is dispatched (cooldown secondary guard)

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
