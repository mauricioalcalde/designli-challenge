import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AuthScreen } from '../src/presentation/screens/AuthScreen';
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
  register: jest.Mock;
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('AuthScreen', () => {
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

  // -----------------------------------------------------------------------
  // Login mode (default)
  // -----------------------------------------------------------------------

  it('renders login mode with email, password, and sign in button', () => {
    renderWithTheme(<AuthScreen />);

    expect(screen.getByTestId('email-input-text-field')).toBeTruthy();
    expect(screen.getByTestId('password-input-text-field')).toBeTruthy();
    // "Sign In" appears on both the toggle tab AND the submit button
    expect(screen.getAllByText('Sign In')).toHaveLength(2);
    expect(screen.queryByTestId('confirm-password-input-text-field')).toBeNull();
  });

  it('blocks login submission and shows field validation errors for invalid input', () => {
    renderWithTheme(<AuthScreen />);

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), 'invalid-email');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), '123');
    fireEvent.press(screen.getByTestId('auth-submit-button'));

    expect(authState.login).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a valid email')).toBeTruthy();
    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
  });

  it('submits trimmed login credentials when the form is valid', () => {
    renderWithTheme(<AuthScreen />);

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), ' user@example.com ');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), 'securePass1');
    fireEvent.press(screen.getByTestId('auth-submit-button'));

    expect(authState.login).toHaveBeenCalledWith('user@example.com', 'securePass1');
  });

  it('shows loading state with disabled button and non-editable inputs', () => {
    authState.isLoading = true;

    renderWithTheme(<AuthScreen />);

    expect(screen.getByTestId('email-input-text-field').props.editable).toBe(false);
    expect(screen.getByTestId('password-input-text-field').props.editable).toBe(false);
    expect(screen.getByTestId('auth-submit-button').props.accessibilityState?.disabled).toBe(true);
  });

  it('renders the auth error message below the form', () => {
    authState.error = 'NetworkError: No internet connection';

    renderWithTheme(<AuthScreen />);

    expect(screen.getByText('NetworkError: No internet connection')).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // Mode toggle
  // -----------------------------------------------------------------------

  it('toggles from login to register mode showing confirm password field', () => {
    renderWithTheme(<AuthScreen />);

    // Initially login mode — no confirm password
    expect(screen.queryByTestId('confirm-password-input-text-field')).toBeNull();

    // Press the create account toggle
    fireEvent.press(screen.getByText("Don't have an account? Create one"));

    // Now register mode — confirm password visible
    expect(screen.getByTestId('confirm-password-input-text-field')).toBeTruthy();
    // "Create Account" appears on both the toggle tab AND the submit button
    expect(screen.getAllByText('Create Account')).toHaveLength(2);
    expect(screen.getByText('Already have an account? Sign In')).toBeTruthy();
  });

  it('toggles from register back to login mode', () => {
    renderWithTheme(<AuthScreen />);

    // Switch to register first
    fireEvent.press(screen.getByText("Don't have an account? Create one"));
    expect(screen.getAllByText('Create Account')).toHaveLength(2);

    // Switch back to login
    fireEvent.press(screen.getByText('Already have an account? Sign In'));

    expect(screen.queryByTestId('confirm-password-input-text-field')).toBeNull();
    expect(screen.getAllByText('Sign In')).toHaveLength(2);
    expect(screen.getByText("Don't have an account? Create one")).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // Register flow
  // -----------------------------------------------------------------------

  it('submits register with email, password, and confirm password on valid form', () => {
    renderWithTheme(<AuthScreen />);

    // Switch to register mode
    fireEvent.press(screen.getByText("Don't have an account? Create one"));

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), ' new@example.com ');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), 'securePass1');
    fireEvent.changeText(screen.getByTestId('confirm-password-input-text-field'), 'securePass1');
    fireEvent.press(screen.getByTestId('auth-submit-button'));

    expect(authState.register).toHaveBeenCalledWith('new@example.com', 'securePass1');
    expect(authState.login).not.toHaveBeenCalled();
  });

  it('shows confirm password mismatch validation error and blocks submission', () => {
    renderWithTheme(<AuthScreen />);

    fireEvent.press(screen.getByText("Don't have an account? Create one"));

    fireEvent.changeText(screen.getByTestId('email-input-text-field'), 'new@example.com');
    fireEvent.changeText(screen.getByTestId('password-input-text-field'), 'securePass1');
    fireEvent.changeText(screen.getByTestId('confirm-password-input-text-field'), 'differentPass');
    fireEvent.press(screen.getByTestId('auth-submit-button'));

    expect(authState.register).not.toHaveBeenCalled();
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
  });

  it('shows server error in register mode', () => {
    authState.error = 'Email already taken';

    renderWithTheme(<AuthScreen />);

    // Switch to register mode
    fireEvent.press(screen.getByText("Don't have an account? Create one"));

    expect(screen.getByText('Email already taken')).toBeTruthy();
  });

  it('shows loading state in register mode', () => {
    authState.isLoading = true;

    renderWithTheme(<AuthScreen />);

    // Switch to register mode
    fireEvent.press(screen.getByText("Don't have an account? Create one"));

    expect(screen.getByTestId('email-input-text-field').props.editable).toBe(false);
    expect(screen.getByTestId('password-input-text-field').props.editable).toBe(false);
    expect(screen.getByTestId('confirm-password-input-text-field').props.editable).toBe(false);
  });
});
