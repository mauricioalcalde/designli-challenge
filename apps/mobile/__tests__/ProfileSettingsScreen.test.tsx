import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileSettingsScreen } from '../src/presentation/screens/ProfileSettingsScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

const mockNavigate = jest.fn();
const mockLogout = jest.fn();
const mockUseAuthStore = jest.fn();
const mockUseConnectivity = jest.fn();
const mockTokenStorageGet = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../src/data/container', () => ({
  useAuthStore: (selector: (state: { logout: () => void }) => unknown) =>
    mockUseAuthStore(selector),
  tokenStorage: { get: () => mockTokenStorageGet() },
}));

jest.mock('../src/presentation/hooks/useConnectivity', () => ({
  useConnectivity: () => mockUseConnectivity(),
}));

jest.mock('../../../package.json', () => ({ version: '0.0.1' }));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ProfileSettingsScreen', () => {
  beforeEach(() => {
    mockUseConnectivity.mockReturnValue(true);
    mockUseAuthStore.mockImplementation((selector: (state: { logout: () => void }) => unknown) =>
      selector({ logout: mockLogout }),
    );
    mockTokenStorageGet.mockReturnValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile details with premium actions', () => {
    renderWithTheme(<ProfileSettingsScreen />);

    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Notifications Settings')).toBeTruthy();
    expect(screen.getByText('Logout')).toBeTruthy();
  });

  it('displays decoded email and avatar initials when token is present', () => {
    const payload = btoa(JSON.stringify({ email: 'john.doe@example.com' }));
    mockTokenStorageGet.mockReturnValue(`header.${payload}.sig`);

    renderWithTheme(<ProfileSettingsScreen />);

    expect(screen.getByText('john.doe@example.com')).toBeTruthy();
    expect(screen.getByText('JD')).toBeTruthy();
  });

  it('shows fallback placeholder when no token is available', () => {
    mockTokenStorageGet.mockReturnValue(undefined);

    renderWithTheme(<ProfileSettingsScreen />);

    expect(screen.getByText('Guest')).toBeTruthy();
    expect(screen.getByText('??')).toBeTruthy();
  });

  it('shows app version', () => {
    renderWithTheme(<ProfileSettingsScreen />);

    expect(screen.getByText('Version 0.0.1')).toBeTruthy();
  });

  it('shows legal links row', () => {
    renderWithTheme(<ProfileSettingsScreen />);

    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getByText('Terms of Service')).toBeTruthy();
  });

  it('navigates to notification settings', () => {
    renderWithTheme(<ProfileSettingsScreen />);

    fireEvent.press(screen.getByTestId('profile-settings-notifications-button'));

    expect(mockNavigate).toHaveBeenCalledWith('NotificationsSettings');
  });

  it('shows logout confirmation via Alert.alert', () => {
    renderWithTheme(<ProfileSettingsScreen />);

    fireEvent.press(screen.getByTestId('profile-settings-logout-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Logout',
      'Are you sure you want to log out?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Logout', style: 'destructive' }),
      ]),
    );
  });

  it('calls logout when user confirms in the alert dialog', () => {
    renderWithTheme(<ProfileSettingsScreen />);

    fireEvent.press(screen.getByTestId('profile-settings-logout-button'));

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertArgs[2] as { text: string; onPress?: () => void }[];
    const confirmButton = buttons.find((b) => b.text === 'Logout');

    expect(confirmButton).toBeDefined();
    confirmButton?.onPress?.();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
