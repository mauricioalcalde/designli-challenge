import { createStorage } from './mmkv';

const storage = createStorage();

const PROMPT_SHOWN_KEY = 'notifications_prompt_shown';
const LAST_PERMISSION_STATUS_KEY = 'notifications_last_permission_status';
const LAST_REGISTERED_AT_KEY = 'notifications_last_registered_at';

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
