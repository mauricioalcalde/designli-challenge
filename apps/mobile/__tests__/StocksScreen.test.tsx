import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StocksScreen } from '../src/presentation/screens/StocksScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';
import type { StocksState } from '../src/application/stocks.store';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

const mockUseStocksStore = jest.fn();
const mockNavigate = jest.fn();
let mockIsOnline = true;
let mockAppState = 'active';

jest.mock('../src/data/container', () => ({
  useStocksStore: (selector: (state: StocksState) => unknown) => mockUseStocksStore(selector),
}));

jest.mock('../src/presentation/hooks/useConnectivity', () => ({
  useConnectivity: () => mockIsOnline,
}));

jest.mock('../src/presentation/hooks/useAppState', () => ({
  useAppState: () => mockAppState,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (callback: () => void | (() => void)) => callback(),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('StocksScreen', () => {
  let state: StocksState;

  beforeEach(() => {
    jest.useFakeTimers();

    state = {
      items: [],
      isInitialLoading: false,
      isBackgroundRefreshing: false,
      isManualRefreshing: false,
      isLoading: false,
      isRefreshing: false,
      isStale: false,
      lastUpdatedAt: null,
      error: null,
      consecutiveRefreshFailures: 0,
      staleReason: null,
      staleMessage: null,
      loadInitial: jest.fn().mockResolvedValue(undefined),
      refreshInBackground: jest.fn().mockResolvedValue(undefined),
      refreshManually: jest.fn().mockResolvedValue(undefined),
      load: jest.fn().mockResolvedValue(undefined),
      refresh: jest.fn().mockResolvedValue(undefined),
      chartData: [],
      chartSymbol: null,
      chartRange: '1W',
      chartIsLoading: false,
      chartError: null,
      chartCache: {},
      loadChart: jest.fn().mockResolvedValue(undefined),
    };

    mockIsOnline = true;
    mockAppState = 'active';

    mockUseStocksStore.mockImplementation((selector: (snapshot: StocksState) => unknown) =>
      selector(state),
    );
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('shows a large skeleton only for the first load without usable data', () => {
    state.isInitialLoading = true;

    renderWithTheme(<StocksScreen />);

    expect(screen.getByTestId('stocks-loading-state')).toBeTruthy();
    expect(screen.getByTestId('stocks-skeleton-card-1')).toBeTruthy();
    expect(screen.queryByTestId('stocks-scroll')).toBeNull();
  });

  it('keeps the list visible while background polling refreshes', () => {
    state.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 212.45,
        changePercent: 1.23,
      },
    ];
    state.lastUpdatedAt = '2026-05-29T16:40:00.000Z';
    state.isBackgroundRefreshing = true;
    state.isRefreshing = true;

    renderWithTheme(<StocksScreen />);

    expect(screen.getByTestId('stocks-list-state')).toBeTruthy();
    expect(screen.getByTestId('stocks-status-pill')).toBeTruthy();
    expect(screen.getByText('Updating…')).toBeTruthy();
    expect(screen.queryByTestId('stocks-loading-state')).toBeNull();
  });

  it('uses RefreshControl only for manual pull-to-refresh', async () => {
    state.items = [
      {
        symbol: 'MSFT',
        name: 'Microsoft',
        currentPrice: 498.12,
        changePercent: -0.47,
      },
    ];
    state.lastUpdatedAt = '2026-05-29T16:40:00.000Z';
    state.isBackgroundRefreshing = true;
    state.isRefreshing = true;

    renderWithTheme(<StocksScreen />);

    const scrollView = screen.getByTestId('stocks-scroll');
    expect(scrollView.props.refreshControl.props.refreshing).toBe(false);

    await act(async () => {
      await scrollView.props.refreshControl.props.onRefresh();
    });

    expect(state.refreshManually).toHaveBeenCalledTimes(1);
  });

  it('shows a subtle stale cached status when refresh fails but data exists', () => {
    state.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 212.45,
        changePercent: 1.23,
      },
    ];
    state.lastUpdatedAt = '2026-05-28T22:30:00.000Z';
    state.isStale = true;
    state.consecutiveRefreshFailures = 1;

    renderWithTheme(<StocksScreen />);

    expect(screen.getByTestId('stocks-status-pill')).toBeTruthy();
    expect(screen.getByText('Refresh failed · Showing latest cached data')).toBeTruthy();
    expect(screen.queryByTestId('stocks-loading-state')).toBeNull();
  });

  it('shows offline cached status and pauses active polling eligibility', () => {
    state.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 212.45,
        changePercent: 1.23,
      },
    ];
    state.lastUpdatedAt = '2026-05-28T22:30:00.000Z';
    mockIsOnline = false;

    renderWithTheme(<StocksScreen />);

    expect(screen.getByText('Offline · Cached data')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(15000);
    });
    expect(state.refreshInBackground).not.toHaveBeenCalled();
  });

  it('shows a retry state when first load fails and no data exists', () => {
    state.error = 'No internet connection';

    renderWithTheme(<StocksScreen />);

    expect(screen.getByTestId('stocks-error-state')).toBeTruthy();
    expect(screen.getByText('Failed to load market data')).toBeTruthy();
    fireEvent.press(screen.getByTestId('stocks-error-content-action-button'));
    expect(state.loadInitial).toHaveBeenCalledTimes(2);
  });

  it('navigates to StockChart with the tapped symbol', () => {
    state.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 212.45,
        changePercent: 1.23,
      },
    ];
    state.lastUpdatedAt = '2026-05-29T16:40:00.000Z';

    renderWithTheme(<StocksScreen />);

    fireEvent.press(screen.getByTestId('stock-item-card-AAPL'));
    expect(mockNavigate).toHaveBeenCalledWith('StockChart', { symbol: 'AAPL' });
  });
});
