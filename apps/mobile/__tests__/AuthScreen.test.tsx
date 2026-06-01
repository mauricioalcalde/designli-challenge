import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { LoginScreen } from '../src/presentation/screens/LoginScreen';
import { RegisterScreen } from '../src/presentation/screens/RegisterScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

const mockUseAuthStore = jest.fn();

jest.mock('../src/data/container', () => ({
  useAuthStore: (selector: (state: AuthStoreSnapshot) => unknown) => mockUseAuthStore(selector),
}));

jest.mock('../src/presentation/components/ConnectivityBanner', () => ({
  ConnectivityBanner: () => null,
}));

type AuthStoreSnapshot = {
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: jest.Mock;
  register: jest.Mock;
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <NavigationContainer>{ui}</NavigationContainer>
    </ThemeProvider>,
  );
}

describe('Minimal premium auth screens', () => {
  let authState: AuthStoreSnapshot;

  beforeEach(() => {
    authState = {
      error: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    };

    mockUseAuthStore.mockImplementation((selector: (state: AuthStoreSnapshot) => unknown) =>
      selector(authState),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders login screen without fake register tabs or forgot password CTA', () => {
    renderWithProviders(<LoginScreen />);

    expect(screen.getByText('Welcome back')).toBeTruthy();
    expect(
      screen.getByText('Sign in to continue tracking your market and managing alerts.'),
    ).toBeTruthy();
    expect(screen.getByTestId('email-input-text-field')).toBeTruthy();
    expect(screen.getByTestId('password-input-text-field')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.getByText('Create account')).toBeTruthy();
    expect(screen.queryByText('Forgot password?')).toBeNull();
    expect(screen.queryByText('Register')).toBeNull();
    expect(screen.queryByTestId('confirm-password-input-text-field')).toBeNull();
  });

  it('blocks invalid login submit and shows field validation', () => {
    renderWithProviders(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), 'invalid-email');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), '123');
    fireEvent.press(screen.getByTestId('auth-submit-button'));

    expect(authState.login).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a valid email')).toBeTruthy();
    expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
  });

  it('submits trimmed login credentials when valid', () => {
    renderWithProviders(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), ' user@example.com ');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), 'securePass1');
    fireEvent.press(screen.getByTestId('auth-submit-button'));

    expect(authState.login).toHaveBeenCalledWith('user@example.com', 'securePass1');
  });

  it('renders register screen with only challenge-required fields', () => {
    renderWithProviders(<RegisterScreen />);

    expect(screen.getByText('Create your account')).toBeTruthy();
    expect(
      screen.getByText(
        'Join Designli to start tracking stocks, getting alerts, and managing your portfolio.',
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId('full-name-input-text-field')).toBeNull();
    expect(screen.getByTestId('email-input-text-field')).toBeTruthy();
    expect(screen.getByTestId('password-input-text-field')).toBeTruthy();
    expect(screen.getByTestId('confirm-password-input-text-field')).toBeTruthy();
    expect(
      screen.getByText('Use 8+ characters with a mix of letters, numbers & symbols.'),
    ).toBeTruthy();
  });

  it('blocks register when confirm password mismatches', () => {
    renderWithProviders(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), 'new@example.com');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), 'securePass1!');
    fireEvent.changeText(screen.getByTestId('confirm-password-input-text-field'), 'differentPass');
    fireEvent.press(screen.getByTestId('auth-submit-button'));

    expect(authState.register).not.toHaveBeenCalled();
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
  });

  it('submits register with email and password only', () => {
    renderWithProviders(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), ' new@example.com ');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), 'securePass1!');
    fireEvent.changeText(screen.getByTestId('confirm-password-input-text-field'), 'securePass1!');
    fireEvent.press(screen.getByTestId('auth-submit-button'));

    expect(authState.register).toHaveBeenCalledWith('new@example.com', 'securePass1!');
  });
});
