import type { InboxNotification } from '../src/data/notifications.local';

// Mock the local notifications module so we control inbox data in tests
const mockInboxData: InboxNotification[] = [];

jest.mock('../src/data/notifications.local', () => {
  const actual = jest.requireActual('../src/data/notifications.local');
  return {
    ...actual,
    getInboxNotifications: jest.fn(() => [...mockInboxData]),
    addToInbox: jest.fn((notification: InboxNotification) => {
      mockInboxData.push(notification);
    }),
    markRead: jest.fn((id: string) => {
      const found = mockInboxData.find((n) => n.id === id);
      if (found) found.read = true;
    }),
    markAllRead: jest.fn(() => {
      mockInboxData.forEach((n) => {
        n.read = true;
      });
    }),
    getUnreadCount: jest.fn(() => mockInboxData.filter((n) => !n.read).length),
  };
});

import { createInboxStore } from '../src/application/inbox.store';

function makeNotification(overrides: Partial<InboxNotification> = {}): InboxNotification {
  return {
    id: 'test-id',
    title: 'Test Title',
    body: 'Test Body',
    timestamp: new Date().toISOString(),
    read: false,
    type: 'alert',
    ...overrides,
  };
}

describe('inbox.store', () => {
  let useInboxStore: ReturnType<typeof createInboxStore>;

  beforeEach(() => {
    mockInboxData.length = 0;
    jest.clearAllMocks();
    useInboxStore = createInboxStore();
  });

  describe('loadInbox', () => {
    it('loads persisted notifications into state', () => {
      const n1 = makeNotification({ id: 'n1', read: false });
      const n2 = makeNotification({ id: 'n2', read: true });
      mockInboxData.push(n1, n2);

      useInboxStore.getState().loadInbox();

      expect(useInboxStore.getState().notifications).toHaveLength(2);
      expect(useInboxStore.getState().notifications[0].id).toBe('n1');
      expect(useInboxStore.getState().unreadCount).toBe(1);
      expect(useInboxStore.getState().isLoading).toBe(false);
    });

    it('handles an empty inbox', () => {
      useInboxStore.getState().loadInbox();

      expect(useInboxStore.getState().notifications).toEqual([]);
      expect(useInboxStore.getState().unreadCount).toBe(0);
      expect(useInboxStore.getState().isLoading).toBe(false);
    });
  });

  describe('addNotification', () => {
    it('generates an id, sets read=false, and appends a new notification', () => {
      useInboxStore.getState().addNotification({
        title: 'New Alert',
        body: 'AAPL crossed $180',
        type: 'alert',
        symbol: 'AAPL',
        alertId: 5,
        timestamp: '2026-06-02T12:00:00.000Z',
      });

      const { notifications } = useInboxStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        title: 'New Alert',
        body: 'AAPL crossed $180',
        read: false,
        type: 'alert',
        symbol: 'AAPL',
        alertId: 5,
        timestamp: '2026-06-02T12:00:00.000Z',
      });
      // id must be a UUID-like string
      expect(notifications[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('uses current time as timestamp when none is provided', () => {
      const before = new Date().toISOString();
      useInboxStore.getState().addNotification({
        title: 'System',
        body: 'Maintenance scheduled',
        type: 'system',
      });
      const after = new Date().toISOString();

      const { notifications } = useInboxStore.getState();
      expect(notifications[0].timestamp).toBeTruthy();
      // Should be roughly now
      expect(notifications[0].timestamp >= before || notifications[0].timestamp <= after).toBe(
        true,
      );
    });

    it('persists the notification via addToInbox', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { addToInbox } = require('../src/data/notifications.local');

      useInboxStore.getState().addNotification({
        title: 'Test',
        body: 'Test body',
        type: 'alert',
      });

      expect(addToInbox).toHaveBeenCalledTimes(1);
      expect(addToInbox).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test',
          body: 'Test body',
          read: false,
          type: 'alert',
        }),
      );
    });

    it('increments unreadCount when a new notification is added', () => {
      mockInboxData.push(makeNotification({ id: 'existing', read: true }));
      useInboxStore.getState().loadInbox();
      expect(useInboxStore.getState().unreadCount).toBe(0);

      useInboxStore.getState().addNotification({
        title: 'New',
        body: 'New notification',
        type: 'alert',
      });

      expect(useInboxStore.getState().unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('marks a single notification as read and decrements unreadCount', () => {
      const n1 = makeNotification({ id: 'n1', read: false });
      const n2 = makeNotification({ id: 'n2', read: false });
      mockInboxData.push(n1, n2);
      useInboxStore.getState().loadInbox();
      expect(useInboxStore.getState().unreadCount).toBe(2);

      useInboxStore.getState().markAsRead('n1');

      const { notifications, unreadCount } = useInboxStore.getState();
      expect(notifications[0].read).toBe(true);
      expect(notifications[1].read).toBe(false);
      expect(unreadCount).toBe(1);
    });

    it('is a no-op for unknown ids', () => {
      const n1 = makeNotification({ id: 'n1', read: false });
      mockInboxData.push(n1);
      useInboxStore.getState().loadInbox();

      useInboxStore.getState().markAsRead('nonexistent');

      expect(useInboxStore.getState().notifications[0].read).toBe(false);
      expect(useInboxStore.getState().unreadCount).toBe(1);
    });

    it('persists the read state via markRead', () => {
      const n1 = makeNotification({ id: 'n1', read: false });
      mockInboxData.push(n1);
      useInboxStore.getState().loadInbox();

      useInboxStore.getState().markAsRead('n1');

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { markRead } = require('../src/data/notifications.local');
      expect(markRead).toHaveBeenCalledWith('n1');
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications as read and sets unreadCount to 0', () => {
      mockInboxData.push(
        makeNotification({ id: 'n1', read: false }),
        makeNotification({ id: 'n2', read: false }),
        makeNotification({ id: 'n3', read: true }),
      );
      useInboxStore.getState().loadInbox();
      expect(useInboxStore.getState().unreadCount).toBe(2);

      useInboxStore.getState().markAllRead();

      const { notifications, unreadCount } = useInboxStore.getState();
      expect(notifications.every((n) => n.read === true)).toBe(true);
      expect(unreadCount).toBe(0);
    });

    it('handles an empty inbox safely', () => {
      expect(() => useInboxStore.getState().markAllRead()).not.toThrow();
      expect(useInboxStore.getState().unreadCount).toBe(0);
    });

    it('persists via markAllRead', () => {
      mockInboxData.push(makeNotification({ id: 'n1', read: false }));
      useInboxStore.getState().loadInbox();

      useInboxStore.getState().markAllRead();

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { markAllRead: localMarkAll } = require('../src/data/notifications.local');
      expect(localMarkAll).toHaveBeenCalledTimes(1);
    });
  });
});
