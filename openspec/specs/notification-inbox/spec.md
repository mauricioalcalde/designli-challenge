# Notification Inbox Specification

## Purpose

Local-first notification inbox providing persistent storage of triggered alerts and system notifications. Supports unread/read tracking, badge count display, and automatic cap management. Survives app restarts via MMKV persistence.

**Domain layer**: infrastructure (persistence), application (store), presentation (screen)

## Requirements

### Requirement: Inbox Persistence

The system **MUST** persist notifications to MMKV on arrival. Each record **MUST** contain: `id` (UUID), `title`, `body`, `timestamp` (ISO-8601), `read` (boolean), `type` (`'alert' | 'system'`). Alert-type records **SHOULD** include `symbol` and `alertId`. Records **MUST** survive app restarts.

- GIVEN a push notification is received with alert metadata
- WHEN the notification listener processes the payload
- THEN the notification is persisted as an inbox record in MMKV

- GIVEN previously persisted inbox records
- WHEN the app restarts and loads the inbox
- THEN all inbox records are restored from MMKV

### Requirement: Unread Count

The system **MUST** expose the count of unread notifications (`read === false`) via the notification store for badge display. The count **MUST** update reactively when notifications are added or marked read.

- GIVEN some notifications are unread and some are read
- WHEN the store queries unread count
- THEN the count reflects only `read === false` records

### Requirement: Mark as Read

The system **MUST** support single and bulk mark-read operations with immediate MMKV persistence.

- GIVEN an unread notification in the inbox
- WHEN the user taps it
- THEN the notification is marked as read in MMKV

- GIVEN multiple unread notifications
- WHEN the user taps "Mark all as read"
- THEN all notifications are marked read in MMKV

### Requirement: Inbox Cap

The inbox **MUST** be capped at 100 entries. When the cap is exceeded, the oldest entry **MUST** be evicted before the new entry is added.

- GIVEN the inbox has 100 entries
- WHEN a new notification arrives
- THEN the oldest entry is evicted and the new notification is persisted
