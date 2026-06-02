import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppNavigator } from '../src/presentation/navigation/AppNavigator';
import { AuthStack } from '../src/presentation/navigation/AuthStack';
import { ConnectivityBanner } from '../src/presentation/components/ConnectivityBanner';
import { MainTabs } from '../src/presentation/navigation/MainTabs';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';
import type { AlertsState } from '../src/application/alerts.store';
import type { NotificationsState } from '../src/application/notifications.store';
import type { StocksState } from '../src/application/stocks.store';

let mockStockChartImportCount = 0;

jest.mock('../src/presentation/screens/StockChartScreen', () => {
  mockStockChartImportCount += 1;
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    StockChartScreen: () => React.createElement(Text, null, 'Chart screen content'),
  };
});

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

const mockUseAuthStore = jest.fn();
const mockUseAlertsStore = jest.fn();
const mockUseNotificationsStore = jest.fn();
const mockUseStocksStore = jest.fn();
const mockUseConnectivity = jest.fn();

jest.mock('../src/data/container', () => ({
  useAuthStore: (selector: (state: AuthStoreSnapshot) => unknown) => mockUseAuthStore(selector),
  useAlertsStore: (selector: (state: AlertsStoreSnapshot) => unknown) =>
    mockUseAlertsStore(selector),
  useNotificationsStore: (selector: (state: NotificationsStoreSnapshot) => unknown) =>
    mockUseNotificationsStore(selector),
  useStocksStore: (selector: (state: StocksState) => unknown) => mockUseStocksStore(selector),
  tokenStorage: { get: jest.fn(() => undefined) },
}));

jest.mock('../src/presentation/hooks/useConnectivity', () => ({
  useConnectivity: () => mockUseConnectivity(),
}));

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');

  const navigationFallback = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  const NavigationContext = React.createContext(navigationFallback);

  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
    NavigationContext,
    useNavigation: () => React.useContext(NavigationContext),
    useRoute: () => ({ params: {} }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const { Text, View } = jest.requireActual('react-native');
  const { NavigationContext } = jest.requireMock('@react-navigation/native');

  const Screen = () => null;

  const Navigator = ({
    children,
    screenOptions,
  }: {
    children: React.ReactNode;
    screenOptions?: Record<string, unknown>;
  }) => {
    const screens = React.Children.toArray(children).filter(React.isValidElement) as Array<
      React.ReactElement<{
        component?: React.ComponentType;
        getComponent?: () => React.ComponentType;
        name: string;
        options?: Record<string, unknown>;
      }>
    >;
    const [history, setHistory] = React.useState<string[]>(
      screens[0] ? [screens[0].props.name] : [],
    );
    const activeName = history[history.length - 1];
    const activeScreen = screens.find((screen) => screen.props.name === activeName) ?? screens[0];

    if (!activeScreen) {
      return null;
    }

    const ActiveComponent = activeScreen.props.component ?? activeScreen.props.getComponent?.();

    if (!ActiveComponent) {
      return null;
    }

    const navigation = {
      navigate: (name: string) => {
        if (!screens.some((screen) => screen.props.name === name)) {
          return;
        }

        setHistory((current) => [...current, name]);
      },
      replace: (name: string) => {
        if (!screens.some((screen) => screen.props.name === name)) {
          return;
        }

        setHistory((current) => [...current.slice(0, -1), name]);
      },
      goBack: () => {
        setHistory((current) => (current.length > 1 ? current.slice(0, -1) : current));
      },
    };

    return (
      <NavigationContext.Provider value={navigation}>
        <View>
          <Text testID={`stack-screen-${activeScreen.props.name}`}>{activeScreen.props.name}</Text>
          {screenOptions ? (
            <Text testID="stack-screen-options">{JSON.stringify(screenOptions)}</Text>
          ) : null}
          <ActiveComponent />
        </View>
      </NavigationContext.Provider>
    );
  };

  return {
    createNativeStackNavigator: () => ({ Navigator, Screen }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Ionicons: ({
      name,
      color,
      size,
      testID,
    }: {
      name: string;
      color: string;
      size: number;
      testID?: string;
    }) =>
      React.createElement(
        Text,
        { testID: testID ?? `ionicon-${name}`, style: { color, fontSize: size } },
        name,
      ),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = jest.requireActual('react');
  const { Pressable, Text, View } = jest.requireActual('react-native');

  const Screen = () => null;

  const Navigator = ({
    children,
    screenOptions,
  }: {
    children: React.ReactNode;
    screenOptions?: {
      tabBarActiveTintColor?: string;
      tabBarInactiveTintColor?: string;
      tabBarStyle?: Record<string, unknown>;
    };
  }) => {
    const screens = React.Children.toArray(children).filter(React.isValidElement) as Array<
      React.ReactElement<{
        component: React.ComponentType<{ route: { name: string } }>;
        name: string;
        options?: Record<string, unknown> | (() => Record<string, unknown>);
      }>
    >;
    const [activeTab, setActiveTab] = React.useState(screens[0]?.props.name);
    const activeScreen = screens.find((child) => child.props.name === activeTab);

    if (!activeScreen) {
      return null;
    }

    const ActiveComponent = activeScreen.props.component;
    const activeColor = screenOptions?.tabBarActiveTintColor ?? 'active';
    const inactiveColor = screenOptions?.tabBarInactiveTintColor ?? 'inactive';

    return (
      <View>
        <Text testID="tab-count">{String(screens.length)}</Text>
        {screens.map((child) => {
          const isActive = child.props.name === activeTab;
          const resolvedOptions =
            typeof child.props.options === 'function'
              ? child.props.options({ route: { name: child.props.name } })
              : (child.props.options ?? {});
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tabBarIcon = resolvedOptions.tabBarIcon as any;

          return (
            <Pressable key={child.props.name} onPress={() => setActiveTab(child.props.name)}>
              <Text>{child.props.name}</Text>
              {tabBarIcon ? (
                <View testID={`tab-icon-${child.props.name}`}>
                  {tabBarIcon({
                    focused: isActive,
                    color: isActive ? activeColor : inactiveColor,
                    size: 24,
                  })}
                </View>
              ) : null}
            </Pressable>
          );
        })}
        <ActiveComponent route={{ name: activeTab }} />
      </View>
    );
  };

  return {
    createBottomTabNavigator: () => ({ Navigator, Screen }),
  };
});

jest.mock('../src/presentation/screens/AuthScreen', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    AuthScreen: () => React.createElement(Text, null, 'Auth screen content'),
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
    jest.useFakeTimers();
    mockStockChartImportCount = 0;
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
      chartData: [],
      chartSymbol: null,
      chartRange: '1W',
      chartIsLoading: false,
      chartError: null,
      loadChart: jest.fn().mockResolvedValue(undefined),
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
    jest.useRealTimers();
  });

  it('renders only Auth inside AuthStack', () => {
    render(
      <ThemeProvider>
        <AuthStack includeSplash={false} />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('stack-screen-Auth')).toBeTruthy();
    expect(screen.queryByTestId('stack-screen-Stocks')).toBeNull();
    expect(screen.getByText('Auth screen content')).toBeTruthy();
    expect(mockStockChartImportCount).toBe(0);
  });

  it('renders AuthStack when the user is unauthenticated', () => {
    render(<AppNavigator />);

    jest.advanceTimersByTime(1600);

    expect(screen.getByText('Auth')).toBeTruthy();
    expect(screen.getByText('Auth screen content')).toBeTruthy();
    expect(screen.queryByText('Stocks')).toBeNull();
    expect(mockStockChartImportCount).toBe(0);
  });

  it('renders MainTabs with exactly three tabs when authenticated', () => {
    authState.isAuthenticated = true;

    render(<AppNavigator />);

    jest.advanceTimersByTime(1600);

    expect(screen.getByTestId('tab-count').children.join('')).toBe('3');
    expect(screen.getAllByText('Stocks').length).toBeGreaterThan(0);
    expect(screen.getByText('Alerts')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByTestId('stack-screen-StocksList')).toBeTruthy();
    expect(screen.getByText('Apple Inc.')).toBeTruthy();
    expect(screen.queryByText('Auth screen content')).toBeNull();
    expect(mockStockChartImportCount).toBe(0);
  });

  it('renders vector icons for each tab', () => {
    authState.isAuthenticated = true;

    render(<AppNavigator />);

    jest.advanceTimersByTime(1600);

    expect(screen.getByText('trending-up')).toBeTruthy();
    expect(screen.getByText('notifications')).toBeTruthy();
    expect(screen.getByText('person')).toBeTruthy();
  });

  it('active tab icon uses accent color and inactive tabs use muted color', () => {
    authState.isAuthenticated = true;

    render(<AppNavigator />);

    jest.advanceTimersByTime(1600);

    // Stocks is the default active tab
    const stocksIcon = screen.getByTestId('ionicon-trending-up');
    expect(stocksIcon.props.style.color).toBe('#E6847E');

    const alertsIcon = screen.getByTestId('ionicon-notifications');
    expect(alertsIcon.props.style.color).toBe('#8F99B2');

    const profileIcon = screen.getByTestId('ionicon-person');
    expect(profileIcon.props.style.color).toBe('#8F99B2');

    // Switch to Alerts tab
    fireEvent.press(screen.getByText('Alerts'));

    expect(screen.getByTestId('ionicon-trending-up').props.style.color).toBe('#8F99B2');
    expect(screen.getByTestId('ionicon-notifications').props.style.color).toBe('#E6847E');
    expect(screen.getByTestId('ionicon-person').props.style.color).toBe('#8F99B2');
  });

  it('switches from AuthStack to MainTabs when auth state changes', () => {
    const { rerender } = render(<AppNavigator />);

    jest.advanceTimersByTime(1600);

    expect(screen.getByText('Auth screen content')).toBeTruthy();

    authState.isAuthenticated = true;
    rerender(<AppNavigator />);

    jest.advanceTimersByTime(1600);

    expect(screen.queryByText('Auth screen content')).toBeNull();
    expect(screen.getByText('Apple Inc.')).toBeTruthy();
  });

  it('renders nested Alerts and Profile stacks from the tab shell', () => {
    render(
      <ThemeProvider>
        <MainTabs />
      </ThemeProvider>,
    );

    expect(screen.getByText('Apple Inc.')).toBeTruthy();

    fireEvent.press(screen.getByText('Alerts'));
    expect(screen.getByTestId('stack-screen-AlertsList')).toBeTruthy();
    expect(screen.getByText('Track price levels, trigger health, and sync state.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('alerts-list-create-button'));
    expect(screen.getByTestId('stack-screen-CreateAlert')).toBeTruthy();
    expect(
      screen.getByText('Set the exact level and we’ll surface the move with premium clarity.'),
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Profile'));
    expect(screen.getByTestId('stack-screen-ProfileSettings')).toBeTruthy();
    expect(screen.getByText('Guest')).toBeTruthy();

    fireEvent.press(screen.getByTestId('profile-settings-notifications-button'));
    expect(screen.getByTestId('stack-screen-NotificationsSettings')).toBeTruthy();
    expect(screen.getByText('Notifications not supported')).toBeTruthy();
    expect(mockStockChartImportCount).toBe(0);
  });

  it('applies dark-themed native stack header to StocksStack', () => {
    render(
      <ThemeProvider>
        <MainTabs />
      </ThemeProvider>,
    );

    const optionsText = screen.getByTestId('stack-screen-options');
    expect(optionsText.props.children).toContain('backgroundColor');
    expect(optionsText.props.children).toContain('#111531');
  });

  it('applies dark-themed native stack header to AlertsStack', () => {
    render(
      <ThemeProvider>
        <MainTabs />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('Alerts'));

    const optionsText = screen.getByTestId('stack-screen-options');
    expect(optionsText.props.children).toContain('backgroundColor');
    expect(optionsText.props.children).toContain('#111531');
  });

  it('shows the offline banner when disconnected and hides it on reconnect', () => {
    mockUseConnectivity.mockReturnValue(false);
    const { rerender } = render(
      <ThemeProvider>
        <ConnectivityBanner />
      </ThemeProvider>,
    );

    expect(screen.getByText('No internet connection')).toBeTruthy();

    mockUseConnectivity.mockReturnValue(true);
    rerender(
      <ThemeProvider>
        <ConnectivityBanner />
      </ThemeProvider>,
    );

    expect(screen.queryByText('No internet connection')).toBeNull();
  });
});
