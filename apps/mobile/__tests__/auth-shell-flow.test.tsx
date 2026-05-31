import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppNavigator } from '../src/presentation/navigation/AppNavigator';
import type { NotificationsState } from '../src/application/notifications.store';
import type { StocksState } from '../src/application/stocks.store';

type AuthStoreSnapshot = {
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: jest.Mock<Promise<void>, [string, string]>;
};

const mockUseAuthStore = jest.fn();
const mockUseNotificationsStore = jest.fn();
const mockUseStocksStore = jest.fn();
const mockUseConnectivity = jest.fn();

jest.mock('../src/data/container', () => ({
  useAuthStore: (selector: (state: AuthStoreSnapshot) => unknown) =>
    mockUseAuthStore(selector),
  useNotificationsStore: (selector: (state: NotificationsState) => unknown) =>
    mockUseNotificationsStore(selector),
  useStocksStore: (selector: (state: StocksState) => unknown) =>
    mockUseStocksStore(selector),
}));

jest.mock('../src/presentation/hooks/useConnectivity', () => ({
  useConnectivity: () => mockUseConnectivity(),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native-stack', () => {
  const React = jest.requireActual('react');
  const { Text, View } = jest.requireActual('react-native');

  const Screen = ({ name, component: Component }: { name: string; component: React.ComponentType }) => (
    <View>
      <Text>{name}</Text>
      <Component />
    </View>
  );

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      Screen,
    }),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = jest.requireActual('react');
  const { Pressable, Text, View } = jest.requireActual('react-native');

  const Screen = () => null;

  const Navigator = ({ children }: { children: React.ReactNode }) => {
    const screens = React.Children.toArray(children).filter(React.isValidElement) as Array<React.ReactElement<{ component: React.ComponentType<{ route: { name: string } }>; name: string }>>;
    const [activeTab, setActiveTab] = React.useState(screens[0]?.props.name);
    const activeScreen = screens.find((child) => child.props.name === activeTab);

    if (!activeScreen) {
      return null;
    }

    const ActiveComponent = activeScreen.props.component;

    return (
      <View>
        {screens.map((child) => (
          <Pressable key={child.props.name} onPress={() => setActiveTab(child.props.name)}>
            <Text>{child.props.name}</Text>
          </Pressable>
        ))}
        <ActiveComponent route={{ name: activeTab }} />
      </View>
    );
  };

  return {
    createBottomTabNavigator: () => ({ Navigator, Screen }),
  };
});

describe('auth shell runtime flow', () => {
  let authState: AuthStoreSnapshot;
  let notificationsState: NotificationsState;
  let stocksState: StocksState;

  beforeEach(() => {
    authState = {
      error: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn<Promise<void>, [string, string]>(async () => {
        authState.isAuthenticated = true;
        authState.error = null;
      }),
    };

    mockUseAuthStore.mockImplementation((selector: (state: AuthStoreSnapshot) => unknown) =>
      selector(authState),
    );
    notificationsState = {
      permissionStatus: 'unsupported',
      isSupported: false,
      tokenStatus: 'idle',
      isChecking: false,
      isRegistering: false,
      lastRegisteredAt: null,
      error: null,
      refreshStatus: jest.fn().mockResolvedValue(undefined),
      requestPermissionAndRegister: jest.fn().mockResolvedValue(false),
    };
    mockUseNotificationsStore.mockImplementation(
      (selector: (state: NotificationsState) => unknown) => selector(notificationsState),
    );
    stocksState = {
      items: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 212.45,
          changePercent: 1.23,
        },
      ],
      isLoading: false,
      isRefreshing: false,
      isStale: false,
      lastUpdatedAt: null,
      error: null,
      load: jest.fn().mockResolvedValue(undefined),
      refresh: jest.fn().mockResolvedValue(undefined),
    };
    mockUseStocksStore.mockImplementation((selector: (state: StocksState) => unknown) =>
      selector(stocksState),
    );
    mockUseConnectivity.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('transitions from successful login into rendered tabs in one runtime path', async () => {
    const { rerender } = render(<AppNavigator />);

    fireEvent.changeText(screen.getByTestId('email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'securePass1');
    fireEvent.press(screen.getByTestId('login-button'));

    expect(authState.login).toHaveBeenCalledWith('user@example.com', 'securePass1');

    rerender(<AppNavigator />);

    expect(screen.queryByTestId('login-button')).toBeNull();
    expect(screen.getAllByText('Stocks').length).toBeGreaterThan(0);
    expect(screen.getByText('Alerts')).toBeTruthy();
    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByText('Apple Inc.')).toBeTruthy();
  });

  it('surfaces NetworkError on offline login attempts', async () => {
    mockUseConnectivity.mockReturnValue(false);
    authState.login.mockImplementation(async () => {
      authState.error = 'NetworkError: No internet connection';
    });

    const { rerender } = render(<AppNavigator />);

    fireEvent.changeText(screen.getByTestId('email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'securePass1');
    fireEvent.press(screen.getByTestId('login-button'));

    rerender(<AppNavigator />);

    expect(screen.getByText('No internet connection')).toBeTruthy();
    expect(screen.getByText('NetworkError: No internet connection')).toBeTruthy();
    expect(screen.queryByText('Apple Inc.')).toBeNull();
  });

  it('revokes tab access when auth is lost, so back navigation cannot reopen tabs', () => {
    authState.isAuthenticated = true;
    const { rerender } = render(<AppNavigator />);

    expect(screen.getByText('Apple Inc.')).toBeTruthy();

    authState.isAuthenticated = false;
    rerender(<AppNavigator />);

    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.queryByText('Apple Inc.')).toBeNull();
    expect(screen.queryByText('Alerts')).toBeNull();
    expect(screen.queryByText('Notifications')).toBeNull();
  });
});
