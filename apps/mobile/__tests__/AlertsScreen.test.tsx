import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AlertsScreen } from '../src/presentation/screens/AlertsScreen';
import type { AlertsState } from '../src/application/alerts.store';
import type { StocksState } from '../src/application/stocks.store';

const mockUseAlertsStore = jest.fn();
const mockUseStocksStore = jest.fn();

jest.mock('../src/data/container', () => ({
  useAlertsStore: (selector: (state: AlertsState) => unknown) => mockUseAlertsStore(selector),
  useStocksStore: (selector: (state: StocksState) => unknown) => mockUseStocksStore(selector),
}));

describe('AlertsScreen', () => {
  let state: AlertsState;
  let stocksState: StocksState;

  beforeEach(() => {
    state = {
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

    mockUseAlertsStore.mockImplementation((selector: (snapshot: AlertsState) => unknown) =>
      selector(state),
    );
    mockUseStocksStore.mockImplementation((selector: (snapshot: StocksState) => unknown) =>
      selector(stocksState),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while the initial request is pending', () => {
    state.isLoading = true;

    render(<AlertsScreen />);

    expect(screen.getByTestId('alerts-loading-state')).toBeTruthy();
    expect(screen.getByText('Loading alerts...')).toBeTruthy();
  });

  it('shows an explicit empty state when the API returns no items', () => {
    render(<AlertsScreen />);

    expect(screen.getByTestId('alerts-empty-state')).toBeTruthy();
    expect(screen.getByText('No alerts yet')).toBeTruthy();
  });

  it('submits valid create values and resets the form on success', async () => {
    render(<AlertsScreen />);

    fireEvent.changeText(screen.getByTestId('alerts-symbol-input'), ' msft ');
    fireEvent.changeText(screen.getByTestId('alerts-threshold-input'), '400');
    fireEvent.press(screen.getByTestId('alerts-direction-below'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('alerts-submit-button'));
    });

    expect(state.create).toHaveBeenCalledWith({
      symbol: ' msft ',
      threshold: '400',
      direction: 'below',
    });

    await waitFor(() => {
      expect(screen.getByTestId('alerts-symbol-input').props.value).toBe('');
      expect(screen.getByTestId('alerts-threshold-input').props.value).toBe('');
    });
  });

  it('shows validation errors before submitting invalid values', () => {
    render(<AlertsScreen />);

    fireEvent.press(screen.getByTestId('alerts-submit-button'));

    expect(screen.getByText('Symbol is required')).toBeTruthy();
    expect(screen.getByText('Enter a valid threshold')).toBeTruthy();
    expect(state.create).not.toHaveBeenCalled();
  });

  it('shows submit errors from the store and keeps the form values', async () => {
    state.submitError = 'Duplicate request';
    state.create = jest.fn().mockResolvedValue(false);

    render(<AlertsScreen />);

    fireEvent.changeText(screen.getByTestId('alerts-symbol-input'), 'AAPL');
    fireEvent.changeText(screen.getByTestId('alerts-threshold-input'), '180');
    await act(async () => {
      fireEvent.press(screen.getByTestId('alerts-submit-button'));
    });

    expect(screen.getByTestId('alerts-submit-error')).toBeTruthy();
    expect(screen.getByText('Duplicate request')).toBeTruthy();
    expect(screen.getByTestId('alerts-symbol-input').props.value).toBe('AAPL');
  });

  it('shows a submitting state while create is in flight', () => {
    state.isSubmitting = true;

    render(<AlertsScreen />);

    expect(screen.getByTestId('alerts-submit-button').props.accessibilityState.disabled).toBe(true);
  });

  it('renders stock suggestions only from already-loaded stocks state', () => {
    stocksState.items = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 212.45,
        changePercent: 1.23,
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft',
        currentPrice: 401.12,
        changePercent: 0.75,
      },
    ];

    render(<AlertsScreen />);

    expect(screen.getByTestId('alerts-symbol-suggestions')).toBeTruthy();
    fireEvent.press(screen.getByTestId('alerts-suggestion-MSFT'));
    expect(screen.getByTestId('alerts-symbol-input').props.value).toBe('MSFT');
  });

  it('allows manual symbol entry when stocks data is unavailable', async () => {
    render(<AlertsScreen />);

    expect(screen.queryByTestId('alerts-symbol-suggestions')).toBeNull();

    fireEvent.changeText(screen.getByTestId('alerts-symbol-input'), 'TSLA');
    fireEvent.changeText(screen.getByTestId('alerts-threshold-input'), '250');
    await act(async () => {
      fireEvent.press(screen.getByTestId('alerts-submit-button'));
    });

    expect(state.create).toHaveBeenCalledWith({
      symbol: 'TSLA',
      threshold: '250',
      direction: 'above',
    });
  });

  it('shows a retryable error state when loading fails without items', () => {
    state.error = 'No internet connection';

    render(<AlertsScreen />);

    expect(screen.getByTestId('alerts-error-state')).toBeTruthy();
    fireEvent.press(screen.getByTestId('alerts-retry-button'));
    expect(state.load).toHaveBeenCalledTimes(2);
  });

  it('renders alerts rows with symbol, threshold, and direction', () => {
    state.items = [
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
    ];

    render(<AlertsScreen />);

    expect(screen.getByTestId('alerts-list-state')).toBeTruthy();
    expect(screen.getByText('AAPL')).toBeTruthy();
    expect(screen.getByText('Above $180.00')).toBeTruthy();
  });

  it('calls remove for the tapped row', () => {
    state.items = [
      {
        id: 2,
        userId: 7,
        symbol: 'MSFT',
        threshold: 400,
        direction: 'below',
        active: true,
        lastTriggeredAt: null,
        createdAt: '2026-05-29T18:05:00.000Z',
      },
    ];

    render(<AlertsScreen />);

    fireEvent.press(screen.getByTestId('alerts-delete-button-2'));
    expect(state.remove).toHaveBeenCalledWith(2);
  });

  it('reflects row-level deleting state', () => {
    state.items = [
      {
        id: 2,
        userId: 7,
        symbol: 'MSFT',
        threshold: 400,
        direction: 'below',
        active: true,
        lastTriggeredAt: null,
        createdAt: '2026-05-29T18:05:00.000Z',
      },
    ];
    state.deletingIds = [2];

    render(<AlertsScreen />);

    expect(screen.getByText('Deleting...')).toBeTruthy();
  });

  it('shows a row-scoped delete error when removal fails', () => {
    state.items = [
      {
        id: 3,
        userId: 7,
        symbol: 'NVDA',
        threshold: 950,
        direction: 'above',
        active: true,
        lastTriggeredAt: null,
        createdAt: '2026-05-29T18:10:00.000Z',
      },
    ];
    state.deleteErrors = { 3: 'Alert not found' };

    render(<AlertsScreen />);

    expect(screen.getByTestId('alerts-delete-error-3')).toBeTruthy();
    expect(screen.getByText('Alert not found')).toBeTruthy();
  });
});
