import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import type { AlertsState } from '../src/application/alerts.store';
import type { NotificationsState } from '../src/application/notifications.store';
import type { StocksState } from '../src/application/stocks.store';

let mockStockChartImportCount = 0;

type AuthStoreSnapshot = {
  bootstrap: jest.Mock<void, []>;
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: jest.Mock;
  register: jest.Mock;
};

const mockBootstrap = jest.fn<void, []>();
const mockAuthState: AuthStoreSnapshot = {
  bootstrap: mockBootstrap,
  error: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
};

const mockAlertsState: AlertsState = {
  items: [],
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

const mockNotificationsState: NotificationsState = {
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

const mockStocksState: StocksState = {
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

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    remove: jest.fn(),
  })),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light' },
  impactAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
  },
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('../src/data/container', () => {
  const useAuthStore = (selector: (state: AuthStoreSnapshot) => unknown) => selector(mockAuthState);

  useAuthStore.getState = () => mockAuthState;

  return {
    useAuthStore,
    useAlertsStore: (selector: (state: AlertsState) => unknown) => selector(mockAlertsState),
    useNotificationsStore: (selector: (state: NotificationsState) => unknown) =>
      selector(mockNotificationsState),
    useStocksStore: (selector: (state: StocksState) => unknown) => selector(mockStocksState),
  };
});

jest.mock('../src/presentation/hooks/useConnectivity', () => ({
  useConnectivity: () => true,
}));

jest.mock('../src/presentation/screens/StockChartScreen', () => {
  mockStockChartImportCount += 1;
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    StockChartScreen: () => React.createElement(Text, null, 'Mock Stock Chart Screen'),
  };
});

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
    useRoute: () => ({ params: { symbol: 'AAPL' } }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const { Text, View } = jest.requireActual('react-native');
  const { NavigationContext } = jest.requireMock('@react-navigation/native');

  const Screen = () => null;

  const Navigator = ({ children }: { children: React.ReactNode }) => {
    const screens = React.Children.toArray(children).filter(React.isValidElement) as Array<
      React.ReactElement<{
        component?: React.ComponentType;
        getComponent?: () => React.ComponentType;
        name: string;
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
          <ActiveComponent />
        </View>
      </NavigationContext.Provider>
    );
  };

  return {
    createNativeStackNavigator: () => ({ Navigator, Screen }),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = jest.requireActual('react');
  const { Pressable, Text, View } = jest.requireActual('react-native');

  const Screen = () => null;

  const Navigator = ({ children }: { children: React.ReactNode }) => {
    const screens = React.Children.toArray(children).filter(React.isValidElement) as Array<
      React.ReactElement<{
        component: React.ComponentType<{ route: { name: string } }>;
        name: string;
      }>
    >;
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

import App from '../App';

describe('App', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockBootstrap.mockClear();
    mockAuthState.isAuthenticated = false;
    mockAuthState.error = null;
    mockAuthState.isLoading = false;
  });

  it('boots through the real app entry path into the login shell without importing chart code', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('splash-screen')).toBeTruthy());

    act(() => {
      jest.advanceTimersByTime(1600);
    });

    await waitFor(() => expect(screen.getByTestId('auth-screen')).toBeTruthy());

    expect(screen.getByText('Designli')).toBeTruthy();
    expect(screen.getByTestId('auth-submit-button')).toBeTruthy();
    expect(mockBootstrap).toHaveBeenCalledTimes(1);
    expect(mockStockChartImportCount).toBe(0);
  });

  it('boots authenticated users into the three-tab premium shell', async () => {
    mockAuthState.isAuthenticated = true;

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('splash-screen')).toBeTruthy());

    act(() => {
      jest.advanceTimersByTime(1600);
    });

    await waitFor(() => expect(screen.getByTestId('tab-count')).toBeTruthy());

    expect(screen.getByTestId('tab-count').children.join('')).toBe('3');
    expect(screen.getAllByText('Stocks').length).toBeGreaterThan(0);
    expect(screen.getByText('Alerts')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByTestId('stack-screen-StocksList')).toBeTruthy();
  });
});
