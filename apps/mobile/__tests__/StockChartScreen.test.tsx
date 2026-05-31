import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { StocksState } from '../src/application/stocks.store';
import type { AlertsState } from '../src/application/alerts.store';
import type { StockChartPoint } from '@designli-challenge/shared';

// We import the component — it does not exist yet (RED).
import { StockChartScreen } from '../src/presentation/screens/StockChartScreen';

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

// victory-native is mocked via jest.config.js moduleNameMapper → __mocks__/victory-native.tsx

describe('StockChartScreen', () => {
  let stocksState: StocksState;
  let alertsState: AlertsState;
  let route: { params: { symbol: string } };
  let navigation: { goBack: jest.Mock };

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
    navigation = { goBack: jest.fn() };

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

  it('renders the chart screen container when data is available', () => {
    stocksState.chartData = chartPoints;
    stocksState.chartSymbol = 'AAPL';

    render(<StockChartScreen />);

    expect(screen.getByTestId('stock-chart-screen')).toBeTruthy();
    expect(screen.getByTestId('stock-chart-symbol-header')).toBeTruthy();
  });

  it('displays the symbol in the header', () => {
    stocksState.chartData = chartPoints;
    stocksState.chartSymbol = 'AAPL';

    render(<StockChartScreen />);

    expect(screen.getByText('AAPL')).toBeTruthy();
  });

  it('renders timeframe selector pills', () => {
    stocksState.chartData = chartPoints;

    render(<StockChartScreen />);

    expect(screen.getByTestId('chart-timeframe-1D')).toBeTruthy();
    expect(screen.getByTestId('chart-timeframe-1W')).toBeTruthy();
    expect(screen.getByTestId('chart-timeframe-1M')).toBeTruthy();
    expect(screen.getByTestId('chart-timeframe-3M')).toBeTruthy();
    expect(screen.getByTestId('chart-timeframe-1Y')).toBeTruthy();
  });

  it('calls loadChart with current symbol when a new timeframe is tapped', () => {
    stocksState.chartData = chartPoints;
    stocksState.chartSymbol = 'AAPL';

    render(<StockChartScreen />);

    fireEvent.press(screen.getByTestId('chart-timeframe-1M'));
    expect(stocksState.loadChart).toHaveBeenCalledWith('AAPL', '1M');
  });

  it('shows loading state when chart data is being fetched', () => {
    stocksState.chartIsLoading = true;

    render(<StockChartScreen />);

    expect(screen.getByTestId('stock-chart-loading')).toBeTruthy();
  });

  it('shows error state with retry button when chart fetch fails', () => {
    stocksState.chartError = 'Network error';
    stocksState.chartSymbol = 'AAPL';
    stocksState.chartRange = '1W';

    render(<StockChartScreen />);

    expect(screen.getByTestId('stock-chart-error')).toBeTruthy();
    expect(screen.getByText('Network error')).toBeTruthy();

    fireEvent.press(screen.getByTestId('stock-chart-retry-button'));
    expect(stocksState.loadChart).toHaveBeenCalledWith('AAPL', '1W');
  });

  it('shows empty state when chart data is an empty array', () => {
    stocksState.chartSymbol = 'AAPL';

    render(<StockChartScreen />);

    expect(screen.getByTestId('stock-chart-empty')).toBeTruthy();
    expect(screen.getByText('No chart data available')).toBeTruthy();
  });

  it('triggers loadChart on mount with default 1W range', () => {
    render(<StockChartScreen />);

    expect(stocksState.loadChart).toHaveBeenCalledWith('AAPL', '1W');
  });
});
