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

jest.mock('../src/data/container', () => ({
  useNotificationsStore: (selector: (state: NotificationsState) => unknown) =>
    mockUseNotificationsStore(selector),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('NotificationsSettingsScreen', () => {
  let state: NotificationsState;

  beforeEach(() => {
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

  it('shows a loading state before readiness resolves', () => {
    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByTestId('notifications-loading-state')).toBeTruthy();
  });

  it('shows unsupported guidance when the runtime is unavailable', () => {
    state.permissionStatus = 'unsupported';

    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByTestId('notifications-unsupported-state')).toBeTruthy();
    expect(screen.getByText('Notifications unavailable')).toBeTruthy();
    expect(
      screen.getByText(
        'Use a native iOS or Android development build on a supported device to continue.',
      ),
    ).toBeTruthy();
  });

  it('shows denied guidance and keeps the primary action visible', () => {
    state.permissionStatus = 'denied';

    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByTestId('notifications-denied-state')).toBeTruthy();
    expect(screen.getByTestId('notifications-primary-action')).toBeTruthy();
  });

  it('shows a registration failure from the store', () => {
    state.permissionStatus = 'granted';
    state.tokenStatus = 'error';
    state.error = 'Unauthorized';

    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByTestId('notifications-error-state')).toBeTruthy();
    expect(screen.getByText('Unauthorized')).toBeTruthy();
  });

  it('shows a registered success state', () => {
    state.permissionStatus = 'granted';
    state.tokenStatus = 'registered';
    state.lastRegisteredAt = '2026-05-29T18:45:00.000Z';

    renderWithTheme(<NotificationsSettingsScreen />);

    expect(screen.getByTestId('notifications-registered-state')).toBeTruthy();
    expect(screen.getByText('Device registered')).toBeTruthy();
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
});
