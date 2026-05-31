import { ActivityIndicator } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { LoginScreen } from '../src/presentation/screens/LoginScreen';

const mockUseAuthStore = jest.fn();

jest.mock('../src/data/container', () => ({
  useAuthStore: (selector: (state: AuthStoreSnapshot) => unknown) =>
    mockUseAuthStore(selector),
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
    render(<LoginScreen />);

    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByTestId('login-button').props.accessibilityState?.disabled ?? false).toBe(false);
  });

  it('blocks submission and shows field validation errors for invalid input', () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email-input'), 'invalid-email');
    fireEvent.changeText(screen.getByTestId('password-input'), '123');
    fireEvent.press(screen.getByTestId('login-button'));

    expect(authState.login).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a valid email')).toBeTruthy();
    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
  });

  it('submits trimmed credentials when the form is valid', () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email-input'), ' user@example.com ');
    fireEvent.changeText(screen.getByTestId('password-input'), 'securePass1');
    fireEvent.press(screen.getByTestId('login-button'));

    expect(authState.login).toHaveBeenCalledWith('user@example.com', 'securePass1');
  });

  it('shows loading state with disabled button and spinner', () => {
    authState.isLoading = true;

    const { UNSAFE_getByType } = render(<LoginScreen />);

    expect(screen.getByTestId('email-input').props.editable).toBe(false);
    expect(screen.getByTestId('password-input').props.editable).toBe(false);
    expect(screen.getByTestId('login-button').props.accessibilityState?.disabled).toBe(true);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(screen.queryByText('Sign In')).toBeNull();
  });

  it('renders the auth error message below the form', () => {
    authState.error = 'NetworkError: No internet connection';

    render(<LoginScreen />);

    expect(screen.getByText('NetworkError: No internet connection')).toBeTruthy();
  });
});
