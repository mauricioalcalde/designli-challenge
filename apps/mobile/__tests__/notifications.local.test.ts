import type { InboxNotification } from '../src/data/notifications.local';

// Stateful MMKV mock — all instances share this store so writes are visible to reads
const mockMMKVStore = new Map<string, string>();

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn((key: string) => mockMMKVStore.get(key)),
    set: jest.fn((key: string, value: string) => {
      mockMMKVStore.set(key, value);
    }),
    delete: jest.fn((key: string) => {
      mockMMKVStore.delete(key);
    }),
  })),
}));

// Re-read after mock is registered so module-level createStorage() uses the mock
// eslint-disable-next-line @typescript-eslint/no-var-requires
const notificationsLocal = require('../src/data/notifications.local');

function makeNotification(overrides: Partial<InboxNotification> = {}): InboxNotification {
  const id = overrides.id ?? 'test-id';
  return {
    id,
    title: `Title for ${id}`,
    body: `Body for ${id}`,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'alert',
    ...overrides,
  };
}

describe('notifications.local — inbox persistence', () => {
  beforeEach(() => {
    mockMMKVStore.clear();
  });

  describe('getInboxNotifications', () => {
    it('returns an empty array when no inbox data is stored', () => {
      const result = notificationsLocal.getInboxNotifications();
      expect(result).toEqual([]);
    });

    it('returns an empty array when stored data is not valid JSON', () => {
      mockMMKVStore.set('notifications_inbox', '{invalid');
      const result = notificationsLocal.getInboxNotifications();
      expect(result).toEqual([]);
    });
  });

  describe('addToInbox', () => {
    it('persists a notification and returns it on subsequent read', () => {
      const notification = makeNotification();
      notificationsLocal.addToInbox(notification);

      const inbox = notificationsLocal.getInboxNotifications();
      expect(inbox).toHaveLength(1);
      expect(inbox[0]).toMatchObject({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        read: false,
        type: 'alert',
      });
    });

    it('appends new notifications while preserving existing ones', () => {
      const first = makeNotification({ id: 'first' });
      const second = makeNotification({ id: 'second' });

      notificationsLocal.addToInbox(first);
      notificationsLocal.addToInbox(second);

      const inbox = notificationsLocal.getInboxNotifications();
      expect(inbox).toHaveLength(2);
      expect(inbox[0].id).toBe('first');
      expect(inbox[1].id).toBe('second');
    });

    it('evicts the oldest entry when the 100-entry cap is exceeded', () => {
      // Fill inbox to exactly 100 entries
      for (let i = 1; i <= 100; i++) {
        notificationsLocal.addToInbox(
          makeNotification({ id: `n${i}`, timestamp: `2026-01-01T00:00:0${i % 10}.000Z` }),
        );
      }

      // Add one more — oldest (n1) should be evicted
      const entry101 = makeNotification({ id: 'n101' });
      notificationsLocal.addToInbox(entry101);

      const inbox = notificationsLocal.getInboxNotifications();
      expect(inbox).toHaveLength(100);
      expect(inbox[0].id).toBe('n2'); // n1 was evicted
      expect(inbox[99].id).toBe('n101'); // new entry is last
    });
  });

  describe('markRead', () => {
    it('updates the read status of a single notification', () => {
      const notification = makeNotification({ id: 'unread-1', read: false });
      notificationsLocal.addToInbox(notification);

      notificationsLocal.markRead('unread-1');

      const inbox = notificationsLocal.getInboxNotifications();
      expect(inbox[0].read).toBe(true);
    });

    it('does not modify other notifications when marking one as read', () => {
      notificationsLocal.addToInbox(makeNotification({ id: 'a', read: false }));
      notificationsLocal.addToInbox(makeNotification({ id: 'b', read: false }));

      notificationsLocal.markRead('a');

      const inbox = notificationsLocal.getInboxNotifications();
      expect(inbox[0].read).toBe(true);
      expect(inbox[1].read).toBe(false);
    });

    it('is a no-op when the notification id does not exist', () => {
      notificationsLocal.addToInbox(makeNotification({ id: 'exists', read: false }));

      notificationsLocal.markRead('does-not-exist');

      const inbox = notificationsLocal.getInboxNotifications();
      expect(inbox[0].read).toBe(false);
      expect(inbox).toHaveLength(1);
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications as read', () => {
      notificationsLocal.addToInbox(makeNotification({ id: 'a', read: false }));
      notificationsLocal.addToInbox(makeNotification({ id: 'b', read: false }));
      notificationsLocal.addToInbox(makeNotification({ id: 'c', read: false }));

      notificationsLocal.markAllRead();

      const inbox = notificationsLocal.getInboxNotifications();
      expect(inbox.every((n) => n.read === true)).toBe(true);
    });

    it('handles an empty inbox without error', () => {
      expect(() => notificationsLocal.markAllRead()).not.toThrow();
    });
  });

  describe('getUnreadCount', () => {
    it('returns 0 for an empty inbox', () => {
      expect(notificationsLocal.getUnreadCount()).toBe(0);
    });

    it('returns the count of unread notifications', () => {
      notificationsLocal.addToInbox(makeNotification({ id: '1', read: false }));
      notificationsLocal.addToInbox(makeNotification({ id: '2', read: false }));
      notificationsLocal.addToInbox(makeNotification({ id: '3', read: true }));

      expect(notificationsLocal.getUnreadCount()).toBe(2);
    });

    it('returns 0 when all notifications are read', () => {
      notificationsLocal.addToInbox(makeNotification({ id: '1', read: true }));
      notificationsLocal.addToInbox(makeNotification({ id: '2', read: true }));

      expect(notificationsLocal.getUnreadCount()).toBe(0);
    });

    it('reflects markRead changes immediately', () => {
      notificationsLocal.addToInbox(makeNotification({ id: 'a', read: false }));
      expect(notificationsLocal.getUnreadCount()).toBe(1);

      notificationsLocal.markRead('a');
      expect(notificationsLocal.getUnreadCount()).toBe(0);
    });
  });

  describe('persistence across reads', () => {
    it('preserves data on re-read (simulates app restart)', () => {
      // Simulates: app writes notifications → app closes → app reopens → reads notifications
      notificationsLocal.addToInbox(makeNotification({ id: 'persist-1', read: false }));
      notificationsLocal.addToInbox(makeNotification({ id: 'persist-2', read: true }));

      // Re-read (same MMKV store, simulating restart)
      const inbox = notificationsLocal.getInboxNotifications();
      expect(inbox).toHaveLength(2);
      expect(inbox[0].id).toBe('persist-1');
      expect(inbox[0].read).toBe(false);
      expect(inbox[1].id).toBe('persist-2');
      expect(inbox[1].read).toBe(true);
    });
  });
});
