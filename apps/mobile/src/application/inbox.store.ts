import { create } from 'zustand';
import {
  getInboxNotifications,
  addToInbox,
  markRead,
  markAllRead,
  getUnreadCount,
  type InboxNotification,
  type NotificationType,
} from '../data/notifications.local';

// ---------------------------------------------------------------------------
// Public input type for addNotification (no id/read auto-generated)
// ---------------------------------------------------------------------------

export interface AddNotificationInput {
  title: string;
  body: string;
  timestamp?: string;
  type: NotificationType;
  symbol?: string;
  alertId?: number;
}

// ---------------------------------------------------------------------------
// Store state shape
// ---------------------------------------------------------------------------

export interface InboxState {
  notifications: InboxNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  loadInbox: () => void;
  addNotification: (input: AddNotificationInput) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  // crypto.randomUUID is standard in Hermes / React Native
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older runtimes
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toNotification(input: AddNotificationInput): InboxNotification {
  return {
    id: generateId(),
    title: input.title,
    body: input.body,
    timestamp: input.timestamp ?? new Date().toISOString(),
    read: false,
    type: input.type,
    symbol: input.symbol,
    alertId: input.alertId,
  };
}

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

export function createInboxStore() {
  return create<InboxState>()((set, _get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    loadInbox: () => {
      set({ isLoading: true, error: null });
      try {
        const notifications = getInboxNotifications();
        const unreadCount = getUnreadCount();
        set({ notifications, unreadCount, isLoading: false, error: null });
      } catch (e) {
        set({ isLoading: false, error: (e as Error).message ?? 'Failed to load notifications' });
      }
    },

    addNotification: (input: AddNotificationInput) => {
      const notification = toNotification(input);
      addToInbox(notification);

      set((state) => ({
        notifications: [...state.notifications, notification],
        unreadCount: state.unreadCount + 1,
      }));
    },

    markAsRead: (id: string) => {
      markRead(id);

      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        );
        const unreadCount = notifications.filter((n) => !n.read).length;
        return { notifications, unreadCount };
      });
    },

    markAllRead: () => {
      markAllRead();

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    },
  }));
}

// ---------------------------------------------------------------------------
// Pre-instantiated hook for direct use by screens (wired into container.ts
// during Phase 3 wiring; exported here for Phase 2 screen work)
// ---------------------------------------------------------------------------

export const useInboxStore = createInboxStore();
