import React from 'react';
import { RefreshControl } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { StocksState } from '../src/application/stocks.store';
import type { AlertsState } from '../src/application/alerts.store';
import type { StockChartPoint } from '@designli-challenge/shared';

import {
  StockChartScreen,
  calculateYAxisRange,
} from '../src/presentation/screens/StockChartScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';

// ---------------------------------------------------------------------------
// MMKV mock
// ---------------------------------------------------------------------------
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// react-native-gifted-charts mock (pure JS, simple mock)
// ---------------------------------------------------------------------------
jest.mock('react-native-gifted-charts', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  return {
    LineChart: ({ testID = 'stock-line-chart', ...props }: Record<string, unknown>) =>
      React.createElement('LineChart', { testID, ...props }),
  };
});

const mockUseStocksStore = jest.fn();
const mockUseAlertsStore = jest.fn();
const mockUseRoute = jest.fn();
const mockUseNavigation = jest.fn();

jest.mock('../src/data/container', () => ({
  useStocksStore: (selector: (state: StocksState) => unknown) => mockUseStocksStore(selector),
  useAlertsStore: (selector: (state: AlertsState) => unknown) => mockUseAlertsStore(selector),
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
  useNavigation: () => mockUseNavigation(),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('StockChartScreen', () => {
  let stocksState: StocksState;
  let alertsState: AlertsState;
  let route: { params: { symbol: string } };
  let navigation: { goBack: jest.Mock; navigate: jest.Mock };

  const chartPoints: StockChartPoint[] = [
    {
      timestamp: '2026-05-29T10:00:00.000Z',
      open: 210.0,
      high: 213.5,
      low: 209.5,
      close: 212.45,
    },
    {
      timestamp: '2026-05-29T10:15:00.000Z',
      open: 212.45,
      high: 214.0,
      low: 211.8,
      close: 213.2,
    },
    {
      timestamp: '2026-05-29T10:30:00.000Z',
      open: 213.2,
      high: 215.0,
      low: 212.5,
      close: 214.8,
    },
  ];

  beforeEach(() => {
    stocksState = {
      items: [],
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

    alertsState = {
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

    route = { params: { symbol: 'AAPL' } };
    navigation = { goBack: jest.fn(), navigate: jest.fn() };

    mockUseStocksStore.mockImplementation((selector: (snapshot: StocksState) => unknown) =>
      selector(stocksState),
    );
    mockUseAlertsStore.mockImplementation((selector: (snapshot: AlertsState) => unknown) =>
      selector(alertsState),
    );
    mockUseRoute.mockReturnValue(route);
    mockUseNavigation.mockReturnValue(navigation);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the premium detail shell when data is available', () => {
    stocksState.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 214.8,
        changePercent: 1.23,
      },
    ];
    stocksState.chartData = chartPoints;
    stocksState.chartSymbol = 'AAPL';

    renderWithTheme(<StockChartScreen />);

    expect(screen.getByTestId('stock-chart-screen')).toBeTruthy();
    expect(screen.getByTestId('stock-price-hero')).toBeTruthy();
    expect(screen.getByText('Apple Inc.')).toBeTruthy();
    expect(screen.getByText('$214.80')).toBeTruthy();
    expect(screen.getByText('+1.23%')).toBeTruthy();
  });

  it('displays the symbol in the header', () => {
    stocksState.chartData = chartPoints;
    stocksState.chartSymbol = 'AAPL';

    renderWithTheme(<StockChartScreen />);

    expect(screen.getByText('AAPL')).toBeTruthy();
  });

  it('renders timeframe selector pills', () => {
    stocksState.chartData = chartPoints;

    renderWithTheme(<StockChartScreen />);

    expect(screen.getByTestId('chart-timeframe-1D')).toBeTruthy();
    expect(screen.getByTestId('chart-timeframe-1W')).toBeTruthy();
    expect(screen.getByTestId('chart-timeframe-1M')).toBeTruthy();
    expect(screen.getByTestId('chart-timeframe-3M')).toBeTruthy();
    expect(screen.getByTestId('chart-timeframe-1Y')).toBeTruthy();
  });

  it('calls loadChart with current symbol when a new timeframe is tapped', () => {
    stocksState.chartData = chartPoints;
    stocksState.chartSymbol = 'AAPL';

    renderWithTheme(<StockChartScreen />);

    fireEvent.press(screen.getByTestId('chart-timeframe-1M'));
    expect(stocksState.loadChart).toHaveBeenCalledWith('AAPL', '1M');
  });

  it('shows loading state with skeleton placeholders when chart data is being fetched', () => {
    stocksState.chartIsLoading = true;

    renderWithTheme(<StockChartScreen />);

    expect(screen.getByTestId('stock-chart-loading')).toBeTruthy();
    expect(screen.getByTestId('stock-chart-skeleton-hero')).toBeTruthy();
    expect(screen.getByTestId('stock-chart-skeleton-chart')).toBeTruthy();
    expect(screen.queryByText('Loading chart data…')).toBeNull();
  });

  it('shows error state with retry action via EmptyState when chart fetch fails', () => {
    stocksState.chartError = 'Network error';
    stocksState.chartSymbol = 'AAPL';
    stocksState.chartRange = '1W';

    renderWithTheme(<StockChartScreen />);

    expect(screen.getByTestId('stock-chart-error')).toBeTruthy();
    expect(screen.getByText("We couldn't load this chart right now.")).toBeTruthy();
    expect(screen.queryByTestId('stock-chart-retry-button')).toBeNull();

    fireEvent.press(screen.getByTestId('stock-chart-error-content-action-button'));
    expect(stocksState.loadChart).toHaveBeenCalledWith('AAPL', '1W');
  });

  it('shows empty state when chart data is an empty array', () => {
    stocksState.chartSymbol = 'AAPL';

    renderWithTheme(<StockChartScreen />);

    expect(screen.getByTestId('stock-chart-empty')).toBeTruthy();
    expect(screen.getByText('No price history available yet')).toBeTruthy();
  });

  it('triggers loadChart on mount with default 1W range', () => {
    renderWithTheme(<StockChartScreen />);

    expect(stocksState.loadChart).toHaveBeenCalledWith('AAPL', '1W');
  });

  it('renders RefreshControl for pull-to-refresh', () => {
    stocksState.chartData = chartPoints;

    renderWithTheme(<StockChartScreen />);

    expect(screen.UNSAFE_getByType(RefreshControl)).toBeTruthy();
  });

  it('sets RefreshControl refreshing prop based on loading state', () => {
    stocksState.chartData = chartPoints;
    stocksState.chartIsLoading = true;

    renderWithTheme(<StockChartScreen />);

    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    expect(refreshControl.props.refreshing).toBe(true);
  });

  it('calls loadChart with current symbol and range on pull-to-refresh', () => {
    stocksState.chartData = chartPoints;
    stocksState.chartRange = '1M';

    renderWithTheme(<StockChartScreen />);

    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    fireEvent(refreshControl, 'refresh');
    expect(stocksState.loadChart).toHaveBeenCalledWith('AAPL', '1M');
  });

  it('uses the coral premium chart color', () => {
    stocksState.chartData = chartPoints;

    const rendered = renderWithTheme(<StockChartScreen />);

    expect(rendered.UNSAFE_getByProps({ color: '#E6847E' }).props.color).toBe('#E6847E');
  });

  it('shows offline cached-data messaging with a retry action when quote data exists', () => {
    stocksState.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 214.8,
        changePercent: 1.23,
      },
    ];
    stocksState.chartError = 'Offline';
    stocksState.chartSymbol = 'AAPL';

    renderWithTheme(<StockChartScreen />);

    expect(screen.getByText("You're offline. Showing cached data.")).toBeTruthy();
    fireEvent.press(screen.getByTestId('stock-chart-inline-retry-button'));
    expect(stocksState.loadChart).toHaveBeenCalledWith('AAPL', '1W');
  });

  it('navigates to CreateAlert from the premium action row', () => {
    stocksState.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 214.8,
        changePercent: 1.23,
      },
    ];
    stocksState.chartData = chartPoints;

    renderWithTheme(<StockChartScreen />);

    fireEvent.press(screen.getByTestId('stock-chart-create-alert-button'));
    expect(navigation.navigate).toHaveBeenCalledWith('Alerts', {
      screen: 'CreateAlert',
      params: { symbol: 'AAPL', currentPrice: 214.8 },
    });
  });
});

describe('calculateYAxisRange', () => {
  it('calculates min and max with 5% padding from data range', () => {
    const points: StockChartPoint[] = [
      { timestamp: '2026-05-29T10:00:00.000Z', open: 100, high: 110, low: 95, close: 105 },
      { timestamp: '2026-05-29T10:15:00.000Z', open: 105, high: 115, low: 102, close: 110 },
      { timestamp: '2026-05-29T10:30:00.000Z', open: 110, high: 120, low: 108, close: 115 },
    ];

    const result = calculateYAxisRange(points);

    // min = 95, max = 120, range = 25
    // 5% padding = 1.25
    // minValue = 95 - 1.25 = 93.75
    // maxValue = 120 + 1.25 = 121.25
    expect(result.min).toBeCloseTo(93.75, 2);
    expect(result.max).toBeCloseTo(121.25, 2);
  });

  it('returns zero range for empty data', () => {
    const result = calculateYAxisRange([]);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
  });

  it('handles single data point with padding', () => {
    const points: StockChartPoint[] = [
      { timestamp: '2026-05-29T10:00:00.000Z', open: 100, high: 100, low: 100, close: 100 },
    ];

    const result = calculateYAxisRange(points);

    // min = max = 100, range = 0, padding = 0
    // But we want at least some padding for visibility; fallback to 1% of value
    expect(result.min).toBeCloseTo(99, 2);
    expect(result.max).toBeCloseTo(101, 2);
  });
});
