import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppNavigator } from '../src/presentation/navigation/AppNavigator';
import { AuthStack } from '../src/presentation/navigation/AuthStack';
import { ConnectivityBanner } from '../src/presentation/components/ConnectivityBanner';
import { MainTabs } from '../src/presentation/navigation/MainTabs';
import type { AlertsState } from '../src/application/alerts.store';
import type { NotificationsState } from '../src/application/notifications.store';
import type { StocksState } from '../src/application/stocks.store';

const mockUseAuthStore = jest.fn();
const mockUseAlertsStore = jest.fn();
const mockUseNotificationsStore = jest.fn();
const mockUseStocksStore = jest.fn();
const mockUseConnectivity = jest.fn();

jest.mock('../src/data/container', () => ({
  useAuthStore: (selector: (state: AuthStoreSnapshot) => unknown) =>
    mockUseAuthStore(selector),
  useAlertsStore: (selector: (state: AlertsStoreSnapshot) => unknown) =>
    mockUseAlertsStore(selector),
  useNotificationsStore: (selector: (state: NotificationsStoreSnapshot) => unknown) =>
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
      <Text testID={`stack-screen-${name}`}>{name}</Text>
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
        <Text testID="tab-count">{String(screens.length)}</Text>
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

jest.mock('../src/presentation/screens/LoginScreen', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    LoginScreen: () => React.createElement(Text, null, 'Login screen content'),
  };
});

type AuthStoreSnapshot = {
  isAuthenticated: boolean;
};

type AlertsStoreSnapshot = AlertsState;
type NotificationsStoreSnapshot = NotificationsState;
type StocksStoreSnapshot = StocksState;

describe('navigation shell', () => {
  let authState: AuthStoreSnapshot;
  let alertsState: AlertsStoreSnapshot;
  let notificationsState: NotificationsStoreSnapshot;
  let stocksState: StocksStoreSnapshot;

  beforeEach(() => {
    authState = { isAuthenticated: false };
    alertsState = {
      items: [
        {
          id: 1,
          userId: 7,
          symbol: 'AAPL',
          threshold: 180,
          direction: 'above',
          active: true,
          lastTriggeredAt: null,
          createdAt: '2026-05-29T18:00:00.000Z',
        },
      ],
      isLoading: false,
      isSubmitting: false,
      deletingIds: [],
      error: null,
      submitError: null,
      deleteErrors: {},
      load: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue(true),
      remove: jest.fn().mockResolvedValue(undefined),
    };
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
    mockUseAuthStore.mockImplementation((selector: (state: AuthStoreSnapshot) => unknown) =>
      selector(authState),
    );
    mockUseAlertsStore.mockImplementation((selector: (state: AlertsStoreSnapshot) => unknown) =>
      selector(alertsState),
    );
    mockUseNotificationsStore.mockImplementation(
      (selector: (state: NotificationsStoreSnapshot) => unknown) => selector(notificationsState),
    );
    mockUseStocksStore.mockImplementation((selector: (state: StocksStoreSnapshot) => unknown) =>
      selector(stocksState),
    );
    mockUseConnectivity.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders only Login inside AuthStack', () => {
    render(<AuthStack />);

    expect(screen.getByTestId('stack-screen-Login')).toBeTruthy();
    expect(screen.queryByTestId('stack-screen-Stocks')).toBeNull();
    expect(screen.getByText('Login screen content')).toBeTruthy();
  });

  it('renders AuthStack when the user is unauthenticated', () => {
    render(<AppNavigator />);

    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.getByText('Login screen content')).toBeTruthy();
    expect(screen.queryByText('Stocks')).toBeNull();
  });

  it('renders MainTabs with exactly three tabs when authenticated', () => {
    authState.isAuthenticated = true;

    render(<AppNavigator />);

    expect(screen.getByTestId('tab-count').children.join('')).toBe('3');
    expect(screen.getAllByText('Stocks').length).toBeGreaterThan(0);
    expect(screen.getByText('Alerts')).toBeTruthy();
    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByText('Apple Inc.')).toBeTruthy();
    expect(screen.queryByText('Login screen content')).toBeNull();
  });

  it('switches from AuthStack to MainTabs when auth state changes', () => {
    const { rerender } = render(<AppNavigator />);

    expect(screen.getByText('Login screen content')).toBeTruthy();

    authState.isAuthenticated = true;
    rerender(<AppNavigator />);

    expect(screen.queryByText('Login screen content')).toBeNull();
    expect(screen.getByText('Apple Inc.')).toBeTruthy();
  });

  it('shows real stocks content, real alerts content, and replaces Settings with notifications shell', () => {
    render(<MainTabs />);

    expect(screen.getByText('Apple Inc.')).toBeTruthy();

    fireEvent.press(screen.getByText('Alerts'));
    expect(screen.getByText('Above $180.00')).toBeTruthy();

    fireEvent.press(screen.getByText('Notifications'));
    expect(screen.getByText('Notifications unavailable')).toBeTruthy();
  });

  it('shows the offline banner when disconnected and hides it on reconnect', () => {
    mockUseConnectivity.mockReturnValue(false);
    const { rerender } = render(<ConnectivityBanner />);

    expect(screen.getByText('No internet connection')).toBeTruthy();

    mockUseConnectivity.mockReturnValue(true);
    rerender(<ConnectivityBanner />);

    expect(screen.queryByText('No internet connection')).toBeNull();
  });
});
