# Notifications Specification

## Purpose

Device token registration and push notification dispatch via a pluggable notification port. Provides the infrastructure boundary for Firebase Cloud Messaging delivery.

## Requirements

### Requirement: Shared Contracts

`packages/shared/src/types/notification.ts` **MUST** export `DeviceTokenDTO`, `AlertNotificationPayload`, and `NotificationResult` as TypeScript types.

- GIVEN the shared package is installed
- WHEN importing `DeviceTokenDTO`, `AlertNotificationPayload`, and `NotificationResult` from `@designli-challenge/shared`
- THEN all three types resolve and type-check without errors

### Requirement: Device Token Registration

`POST /devices/token` **MUST** accept `{ token, platform }` and persist the device token associated with the authenticated user. Duplicate tokens **SHOULD** be silently ignored (upsert). The endpoint **MUST** be protected by `JwtAuthGuard`.

- GIVEN a valid JWT Bearer token
- WHEN POST /devices/token is called with `{ token: "fcm-token-123", platform: "android" }`
- THEN the response is HTTP 201 and the token is stored for the user

- GIVEN the same device token already registered for the user
- WHEN POST /devices/token is called again with the same token
- THEN the response is HTTP 201 (upsert, no error)

- GIVEN no Authorization header
- WHEN POST /devices/token is called
- THEN the response is HTTP 401

### Requirement: Notification Port Boundary

The system **MUST** define `INotificationSender` as an abstract class in `application/notifications/ports/` with a method `send(userId, payload)` that returns a `NotificationResult`. A `ConsoleNotificationSender` **MUST** implement it for development. A `FirebaseNotificationSender` **SHOULD** implement it for production. The active sender **MUST** be swappable via environment variable `NOTIFICATION_SENDER`.

- GIVEN `NOTIFICATION_SENDER=console`
- WHEN the alert evaluator triggers a notification
- THEN the payload is logged to console

- GIVEN `NOTIFICATION_SENDER=firebase` and Firebase Admin is configured
- WHEN the alert evaluator triggers a notification
- THEN FCM is called with the device token for that user

### Requirement: Notifications Test Suite

The system **MUST** include ≥2 passing tests covering the notification port contract and the console sender adapter.

- GIVEN the API workspace is set up
- WHEN `pnpm -F api test` runs
- THEN ≥2 tests pass covering the port interface and console sender
