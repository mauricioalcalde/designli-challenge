import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StocksScreen } from '../src/presentation/screens/StocksScreen';
import type { StocksState } from '../src/application/stocks.store';

const mockUseStocksStore = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../src/data/container', () => ({
  useStocksStore: (selector: (state: StocksState) => unknown) => mockUseStocksStore(selector),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('StocksScreen', () => {
  let state: StocksState;

  beforeEach(() => {
    state = {
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

    mockUseStocksStore.mockImplementation((selector: (snapshot: StocksState) => unknown) =>
      selector(state),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while the initial request is pending', () => {
    state.isLoading = true;

    render(<StocksScreen />);

    expect(screen.getByTestId('stocks-loading-state')).toBeTruthy();
    expect(screen.getByText('Loading stocks...')).toBeTruthy();
  });

  it('renders stock rows with symbol, name, price, and change percent', () => {
    state.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 212.45,
        changePercent: 1.23,
      },
    ];

    render(<StocksScreen />);

    expect(screen.getByTestId('stocks-list-state')).toBeTruthy();
    expect(screen.getByText('AAPL')).toBeTruthy();
    expect(screen.getByText('Apple Inc.')).toBeTruthy();
    expect(screen.getByText('$212.45')).toBeTruthy();
    expect(screen.getByText('+1.23%')).toBeTruthy();
  });

  it('shows an explicit empty state when the API returns no items', () => {
    render(<StocksScreen />);

    expect(screen.getByTestId('stocks-empty-state')).toBeTruthy();
    expect(screen.getByText('No stocks available')).toBeTruthy();
  });

  it('shows a retryable error state when loading fails without items', () => {
    state.error = 'No internet connection';

    render(<StocksScreen />);

    expect(screen.getByTestId('stocks-error-state')).toBeTruthy();
    fireEvent.press(screen.getByTestId('stocks-retry-button'));
    expect(state.load).toHaveBeenCalledTimes(2);
  });

  it('triggers refresh from pull-to-refresh', async () => {
    state.items = [
      {
        symbol: 'MSFT',
        name: 'Microsoft',
        currentPrice: 498.12,
        changePercent: -0.47,
      },
    ];

    render(<StocksScreen />);

    const scrollView = screen.getByTestId('stocks-scroll');

    await act(async () => {
      await scrollView.props.refreshControl.props.onRefresh();
    });

    expect(state.refresh).toHaveBeenCalledTimes(1);
  });

  it('shows stale snapshot messaging only when cached data rescues a failed load', () => {
    state.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 212.45,
        changePercent: 1.23,
      },
    ];
    state.isStale = true;
    state.lastUpdatedAt = '2026-05-28T22:30:00.000Z';
    state.error = 'No internet connection';

    render(<StocksScreen />);

    expect(screen.getByTestId('stocks-stale-banner')).toBeTruthy();
    expect(screen.getByText('Showing your last saved stocks snapshot.')).toBeTruthy();
    expect(screen.getByText(/Last updated/)).toBeTruthy();
    expect(screen.queryByText('No internet connection')).toBeNull();
  });

  it('navigates to StockChart on stock row tap with symbol param', () => {
    state.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 212.45,
        changePercent: 1.23,
      },
    ];

    render(<StocksScreen />);

    fireEvent.press(screen.getByTestId('stocks-row-AAPL'));
    expect(mockNavigate).toHaveBeenCalledWith('StockChart', { symbol: 'AAPL' });
  });
});
