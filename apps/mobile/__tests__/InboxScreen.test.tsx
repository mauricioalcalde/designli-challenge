import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { InboxScreen } from '../src/presentation/screens/InboxScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';
import type { InboxState } from '../src/application/inbox.store';

// ---------------------------------------------------------------------------
// MMKV mock
// ---------------------------------------------------------------------------
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

const mockUseInboxStore = jest.fn();

jest.mock('../src/application/inbox.store', () => ({
  useInboxStore: (selector: (state: InboxState) => unknown) => mockUseInboxStore(selector),
  createInboxStore: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: (fn: () => void) => {
    fn();
  },
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

// Test helper: create a minimal store state
function inboxState(overrides: Partial<InboxState> = {}): InboxState {
  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    loadInbox: jest.fn(),
    addNotification: jest.fn(),
    markAsRead: jest.fn(),
    markAllRead: jest.fn(),
    ...overrides,
  };
}

describe('InboxScreen', () => {
  let state: InboxState;

  beforeEach(() => {
    state = inboxState();
    mockUseInboxStore.mockImplementation((selector: (snapshot: InboxState) => unknown) =>
      selector(state),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notification list', () => {
    it('renders notification items with title, body, and timestamp', () => {
      const now = new Date('2026-06-02T10:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      state.notifications = [
        {
          id: 'n1',
          title: 'Price Alert',
          body: 'AAPL crossed $180',
          timestamp: new Date('2026-06-02T09:55:00.000Z').toISOString(),
          read: false,
          type: 'alert',
          symbol: 'AAPL',
          alertId: 5,
        },
        {
          id: 'n2',
          title: 'System',
          body: 'Maintenance scheduled',
          timestamp: new Date('2026-06-02T08:00:00.000Z').toISOString(),
          read: true,
          type: 'system',
        },
      ];

      renderWithTheme(<InboxScreen />);

      expect(screen.getByText('Price Alert')).toBeTruthy();
      expect(screen.getByText('AAPL crossed $180')).toBeTruthy();
      expect(screen.getByText('System')).toBeTruthy();
      expect(screen.getByText('Maintenance scheduled')).toBeTruthy();

      jest.useRealTimers();
    });

    it('shows relative timestamps', () => {
      const now = new Date('2026-06-02T10:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      state.notifications = [
        {
          id: 'n1',
          title: 'Alert',
          body: 'Body',
          timestamp: new Date('2026-06-02T09:55:00.000Z').toISOString(),
          read: false,
          type: 'alert',
        },
      ];

      renderWithTheme(<InboxScreen />);

      expect(screen.getByText('5m ago')).toBeTruthy();

      jest.useRealTimers();
    });

    it('shows unread dot indicator for unread notifications', () => {
      state.notifications = [
        {
          id: 'n1',
          title: 'Unread',
          body: 'Unread notification',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'alert',
        },
      ];

      renderWithTheme(<InboxScreen />);

      expect(screen.getByTestId('inbox-item-dot-n1')).toBeTruthy();
    });

    it('does NOT show unread indicator for read notifications', () => {
      state.notifications = [
        {
          id: 'n1',
          title: 'Read',
          body: 'Read notification',
          timestamp: new Date().toISOString(),
          read: true,
          type: 'alert',
        },
      ];

      renderWithTheme(<InboxScreen />);

      expect(screen.queryByTestId('inbox-item-dot-n1')).toBeNull();
    });
  });

  describe('mark as read on tap', () => {
    it('calls markAsRead when tapping a notification', () => {
      state.notifications = [
        {
          id: 'n1',
          title: 'Tap me',
          body: 'Tap to mark read',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'alert',
        },
      ];

      renderWithTheme(<InboxScreen />);

      fireEvent.press(screen.getByTestId('inbox-item-n1'));

      expect(state.markAsRead).toHaveBeenCalledWith('n1');
    });
  });

  describe('mark all as read', () => {
    it('shows "Mark all as read" button when there are unread notifications', () => {
      state.notifications = [
        {
          id: 'n1',
          title: 'Unread',
          body: 'Notification',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'alert',
        },
      ];
      state.unreadCount = 1;

      renderWithTheme(<InboxScreen />);

      expect(screen.getByText('Mark all as read')).toBeTruthy();
    });

    it('calls markAllRead when pressing the mark-all button', () => {
      state.notifications = [
        {
          id: 'n1',
          title: 'Unread',
          body: 'Notification',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'alert',
        },
      ];
      state.unreadCount = 1;

      renderWithTheme(<InboxScreen />);

      fireEvent.press(screen.getByTestId('inbox-mark-all-read'));

      expect(state.markAllRead).toHaveBeenCalledTimes(1);
    });

    it('hides "Mark all as read" button when no unread notifications', () => {
      state.unreadCount = 0;

      renderWithTheme(<InboxScreen />);

      expect(screen.queryByText('Mark all as read')).toBeNull();
    });
  });

  describe('empty state', () => {
    it('shows empty state when there are no notifications', () => {
      renderWithTheme(<InboxScreen />);

      expect(screen.getByText('No notifications yet')).toBeTruthy();
      expect(screen.getByText('Triggered stock alerts will appear here.')).toBeTruthy();
    });

    it('does NOT show empty state when notifications exist', () => {
      state.notifications = [
        {
          id: 'n1',
          title: 'Alert',
          body: 'Body',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'alert',
        },
      ];

      renderWithTheme(<InboxScreen />);

      expect(screen.queryByText('No notifications yet')).toBeNull();
    });
  });

  describe('loading state', () => {
    it('shows loading state when loading with no data', () => {
      state.isLoading = true;

      renderWithTheme(<InboxScreen />);

      expect(screen.getByTestId('inbox-loading-state')).toBeTruthy();
      expect(screen.getByText('Loading notifications...')).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('shows error state with retry when error exists and no data', () => {
      state.error = 'Network failed';
      state.notifications = [];

      renderWithTheme(<InboxScreen />);

      expect(screen.getByTestId('inbox-error-state')).toBeTruthy();
      expect(screen.getByText('Failed to load notifications')).toBeTruthy();
    });
  });

  describe('pull to refresh', () => {
    it('triggers loadInbox on pull-to-refresh', () => {
      state.notifications = [
        {
          id: 'n1',
          title: 'Alert',
          body: 'Body',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'alert',
        },
      ];

      renderWithTheme(<InboxScreen />);

      // Reset mock count after initial useEffect-driven loadInbox
      (state.loadInbox as jest.Mock).mockClear();

      const flatList = screen.getByTestId('inbox-flatlist');
      const { refreshControl } = flatList.props;

      act(() => {
        refreshControl.props.onRefresh();
      });

      expect(state.loadInbox).toHaveBeenCalledTimes(1);
    });
  });
});
