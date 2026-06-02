import { createStorage } from './mmkv';

const storage = createStorage();

const PROMPT_SHOWN_KEY = 'notifications_prompt_shown';
const LAST_PERMISSION_STATUS_KEY = 'notifications_last_permission_status';
const LAST_REGISTERED_AT_KEY = 'notifications_last_registered_at';
const INBOX_KEY = 'notifications_inbox';

const MAX_INBOX_SIZE = 100;

// ---------------------------------------------------------------------------
// Inbox notification type
// ---------------------------------------------------------------------------

export type NotificationType = 'alert' | 'system';

export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  symbol?: string;
  alertId?: number;
}

// ---------------------------------------------------------------------------
// Inbox persistence helpers
// ---------------------------------------------------------------------------

function loadInbox(): InboxNotification[] {
  const raw = storage.getString(INBOX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as InboxNotification[];
  } catch {
    return [];
  }
}

function saveInbox(inbox: InboxNotification[]): void {
  storage.set(INBOX_KEY, JSON.stringify(inbox));
}

// ---------------------------------------------------------------------------
// Inbox public API
// ---------------------------------------------------------------------------

export function getInboxNotifications(): InboxNotification[] {
  return loadInbox();
}

export function addToInbox(notification: InboxNotification): void {
  const inbox = loadInbox();
  if (inbox.length >= MAX_INBOX_SIZE) {
    inbox.shift();
  }
  inbox.push(notification);
  saveInbox(inbox);
}

export function markRead(notificationId: string): void {
  const inbox = loadInbox();
  const updated = inbox.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  saveInbox(updated);
}

export function markAllRead(): void {
  const inbox = loadInbox();
  const updated = inbox.map((n) => ({ ...n, read: true }));
  saveInbox(updated);
}

export function getUnreadCount(): number {
  const inbox = loadInbox();
  return inbox.filter((n) => !n.read).length;
}

// ---------------------------------------------------------------------------
// Notifications onboarding (existing)
// ---------------------------------------------------------------------------

export function getNotificationsPromptShown(): boolean {
  return storage.getString(PROMPT_SHOWN_KEY) === 'true';
}

export function setNotificationsPromptShown(value: boolean): void {
  storage.set(PROMPT_SHOWN_KEY, value ? 'true' : 'false');
}

export function getLastPermissionStatus(): string | null {
  return storage.getString(LAST_PERMISSION_STATUS_KEY) ?? null;
}

export function setLastPermissionStatus(value: string): void {
  storage.set(LAST_PERMISSION_STATUS_KEY, value);
}

export function getLastRegisteredAt(): string | null {
  return storage.getString(LAST_REGISTERED_AT_KEY) ?? null;
}

export function setLastRegisteredAt(value: string | null): void {
  if (value) {
    storage.set(LAST_REGISTERED_AT_KEY, value);
  }
}
