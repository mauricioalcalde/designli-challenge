import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { LoginScreen } from '../src/presentation/screens/LoginScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';

// ---------------------------------------------------------------------------
// MMKV + store mocks
// ---------------------------------------------------------------------------
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    remove: jest.fn(),
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
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('LoginScreen', () => {
  let authState: AuthStoreSnapshot;

  beforeEach(() => {
    authState = {
      error: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
    };

    mockUseAuthStore.mockImplementation((selector: (state: AuthStoreSnapshot) => unknown) =>
      selector(authState),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a pristine form with submit enabled', () => {
    renderWithTheme(<LoginScreen />);

    // Input fields are themed — placeholder still works
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    // Button uses accessibilityState for disabled
    expect(screen.getByTestId('login-button').props.accessibilityState?.disabled ?? false).toBe(
      false,
    );
  });

  it('blocks submission and shows field validation errors for invalid input', () => {
    renderWithTheme(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), 'invalid-email');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), '123');
    fireEvent.press(screen.getByTestId('login-button'));

    expect(authState.login).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a valid email')).toBeTruthy();
    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
  });

  it('submits trimmed credentials when the form is valid', () => {
    renderWithTheme(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), ' user@example.com ');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), 'securePass1');
    fireEvent.press(screen.getByTestId('login-button'));

    expect(authState.login).toHaveBeenCalledWith('user@example.com', 'securePass1');
  });

  it('shows loading state with disabled button and spinner', () => {
    authState.isLoading = true;

    renderWithTheme(<LoginScreen />);

    // Input fields are non-editable when loading
    expect(screen.getByTestId('email-input-text-field').props.editable).toBe(false);
    expect(screen.getByTestId('password-input-text-field').props.editable).toBe(false);
    expect(screen.getByTestId('login-button').props.accessibilityState?.disabled).toBe(true);
  });

  it('renders the auth error message below the form', () => {
    authState.error = 'NetworkError: No internet connection';

    renderWithTheme(<LoginScreen />);

    expect(screen.getByText('NetworkError: No internet connection')).toBeTruthy();
  });
});
