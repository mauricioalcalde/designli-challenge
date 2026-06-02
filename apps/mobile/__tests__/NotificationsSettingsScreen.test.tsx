import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { NotificationsSettingsScreen } from '../src/presentation/screens/NotificationsSettingsScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';
import type { NotificationsState } from '../src/application/notifications.store';

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

const mockUseNotificationsStore = jest.fn();
const mockUseConnectivity = jest.fn();

jest.mock('../src/data/container', () => ({
  useNotificationsStore: (selector: (state: NotificationsState) => unknown) =>
    mockUseNotificationsStore(selector),
}));

jest.mock('../src/presentation/hooks/useConnectivity', () => ({
  useConnectivity: () => mockUseConnectivity(),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('NotificationsSettingsScreen', () => {
  let state: NotificationsState;

  beforeEach(() => {
    mockUseConnectivity.mockReturnValue(true);
    state = {
      permissionStatus: 'unknown',
      isSupported: true,
      tokenStatus: 'idle',
      isChecking: false,
      isRegistering: false,
      lastRegisteredAt: null,
      error: null,
      refreshStatus: jest.fn().mockResolvedValue(undefined),
      requestPermissionAndRegister: jest.fn().mockResolvedValue(true),
    };

    mockUseNotificationsStore.mockImplementation(
      (selector: (snapshot: NotificationsState) => unknown) => selector(state),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes the notification status on mount', () => {
    renderWithTheme(<NotificationsSettingsScreen />);

    expect(state.refreshStatus).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state before readiness resolves', () => {
    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByTestId('notifications-loading-state')).toBeTruthy();
  });

  it('shows unsupported guidance when the runtime is unavailable', () => {
    state.permissionStatus = 'unsupported';

    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByTestId('notifications-unsupported-state')).toBeTruthy();
    expect(screen.getByText('Notifications not supported')).toBeTruthy();
    expect(screen.queryByTestId('notifications-primary-action')).toBeNull();
  });

  it('shows disabled guidance and the enable CTA', () => {
    state.permissionStatus = 'denied';

    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByTestId('notifications-status-card')).toBeTruthy();
    expect(screen.getByText('Notifications are disabled')).toBeTruthy();
    expect(screen.getByText('Get notified when your alerts are triggered')).toBeTruthy();
    expect(screen.getByText('Enable Notifications')).toBeTruthy();
    expect(screen.getByTestId('notifications-primary-action')).toBeTruthy();
  });

  it('shows a retryable sync failure from the store', () => {
    state.permissionStatus = 'granted';
    state.tokenStatus = 'error';
    state.error = 'Unauthorized';

    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByTestId('notifications-sync-error')).toBeTruthy();
    expect(screen.getByText('Sync failed. Tap to retry.')).toBeTruthy();
  });

  it('shows an enabled state with the manage settings CTA', () => {
    state.permissionStatus = 'granted';
    state.tokenStatus = 'registered';
    state.lastRegisteredAt = '2026-05-29T18:45:00.000Z';

    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByText('Notifications are enabled')).toBeTruthy();
    expect(screen.getByText('Manage Settings')).toBeTruthy();
  });

  it('shows a spinner on the CTA while registration is running', () => {
    state.permissionStatus = 'granted';
    state.isRegistering = true;
    state.tokenStatus = 'registering';

    renderWithTheme(<NotificationsSettingsScreen />);

    expect(
      screen.getByTestId('notifications-primary-action').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('calls the store registration action when the CTA is pressed', async () => {
    state.permissionStatus = 'denied';

    renderWithTheme(<NotificationsSettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('notifications-primary-action'));
    });

    expect(state.requestPermissionAndRegister).toHaveBeenCalledTimes(1);
  });

  it('retries failed sync when the retry action is pressed', async () => {
    state.permissionStatus = 'granted';
    state.tokenStatus = 'error';
    state.error = 'Unauthorized';

    renderWithTheme(<NotificationsSettingsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('notifications-sync-error-action'));
    });

    expect(state.requestPermissionAndRegister).toHaveBeenCalledTimes(1);
  });
});
