import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { CreateAlertScreen } from '../src/presentation/screens/CreateAlertScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';
import type { AlertsState } from '../src/application/alerts.store';
import type { StocksState } from '../src/application/stocks.store';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

const mockUseAlertsStore = jest.fn();
const mockUseStocksStore = jest.fn();
const mockUseRoute = jest.fn();
const mockUseNavigation = jest.fn();
const mockUseConnectivity = jest.fn();

jest.mock('../src/data/container', () => ({
  useAlertsStore: (selector: (state: AlertsState) => unknown) => mockUseAlertsStore(selector),
  useStocksStore: (selector: (state: StocksState) => unknown) => mockUseStocksStore(selector),
}));

jest.mock('../src/presentation/hooks/useConnectivity', () => ({
  useConnectivity: () => mockUseConnectivity(),
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
  useNavigation: () => mockUseNavigation(),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('CreateAlertScreen', () => {
  let alertsState: AlertsState;
  let stocksState: StocksState;
  let route: { params?: { symbol?: string; currentPrice?: number } };
  let navigation: { goBack: jest.Mock; navigate: jest.Mock };

  beforeEach(() => {
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

    stocksState = {
      items: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 214.8,
          changePercent: 1.23,
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft',
          currentPrice: 401.12,
          changePercent: 0.75,
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

    route = { params: undefined };
    navigation = { goBack: jest.fn(), navigate: jest.fn() };

    mockUseAlertsStore.mockImplementation((selector: (snapshot: AlertsState) => unknown) =>
      selector(alertsState),
    );
    mockUseStocksStore.mockImplementation((selector: (snapshot: StocksState) => unknown) =>
      selector(stocksState),
    );
    mockUseRoute.mockReturnValue(route);
    mockUseNavigation.mockReturnValue(navigation);
    mockUseConnectivity.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not render a custom Back button; relies on native header back', () => {
    route.params = { symbol: 'AAPL', currentPrice: 214.8 };

    renderWithTheme(<CreateAlertScreen />);

    expect(screen.queryByTestId('create-alert-back-button')).toBeNull();
    expect(screen.queryByText('Back')).toBeNull();
  });

  it('shows the selected stock context when it comes from the chart flow', () => {
    route.params = { symbol: 'AAPL', currentPrice: 214.8 };

    renderWithTheme(<CreateAlertScreen />);

    expect(screen.getByText('AAPL')).toBeTruthy();
    expect(screen.getByText('Current price $214.80')).toBeTruthy();
  });

  it('uses the coral focus border for the target price input', () => {
    renderWithTheme(<CreateAlertScreen />);

    fireEvent(screen.getByTestId('create-alert-target-input-text-field'), 'focus');

    const style = StyleSheet.flatten(
      screen.getByTestId('create-alert-target-input-text-field').props.style,
    );

    expect(style.borderColor).toBe('#E6847E');
  });

  it('uses SegmentedControl for direction selector instead of Chip', () => {
    route.params = { symbol: 'AAPL', currentPrice: 214.8 };

    const { queryByTestId } = renderWithTheme(<CreateAlertScreen />);

    expect(queryByTestId('create-alert-direction-option-above')).toBeTruthy();
    expect(queryByTestId('create-alert-direction-option-below')).toBeTruthy();
    expect(queryByTestId('create-alert-direction-above')).toBeNull();
    expect(queryByTestId('create-alert-direction-below')).toBeNull();
  });

  it('updates the explanation when the user changes direction and target price', () => {
    route.params = { symbol: 'AAPL', currentPrice: 214.8 };

    renderWithTheme(<CreateAlertScreen />);

    fireEvent.changeText(screen.getByTestId('create-alert-target-input-text-field'), '220');
    fireEvent.press(screen.getByTestId('create-alert-direction-option-below'));

    expect(screen.getByText('Get notified when AAPL price goes below $220.00')).toBeTruthy();
  });

  it('submits a valid alert and navigates back to the list on success', async () => {
    route.params = { symbol: 'AAPL', currentPrice: 214.8 };

    renderWithTheme(<CreateAlertScreen />);

    fireEvent.changeText(screen.getByTestId('create-alert-target-input-text-field'), '220');

    await act(async () => {
      fireEvent.press(screen.getByTestId('create-alert-submit-button'));
    });

    expect(alertsState.create).toHaveBeenCalledWith({
      symbol: 'AAPL',
      threshold: '220',
      direction: 'above',
    });
    expect(navigation.navigate).toHaveBeenCalledWith('AlertsList', {
      feedback: {
        tone: 'success',
        title: 'Alert created',
        message: 'We’ll watch AAPL and let you know when it moves above $220.00.',
      },
    });
  });

  it('creates a pending local alert when offline and returns to the list with sync copy', async () => {
    mockUseConnectivity.mockReturnValue(false);
    route.params = { symbol: 'TSLA', currentPrice: 250.14 };

    renderWithTheme(<CreateAlertScreen />);

    fireEvent.changeText(screen.getByTestId('create-alert-target-input-text-field'), '255');

    await act(async () => {
      fireEvent.press(screen.getByTestId('create-alert-submit-button'));
    });

    expect(alertsState.create).not.toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith(
      'AlertsList',
      expect.objectContaining({
        createdDraft: expect.objectContaining({
          symbol: 'TSLA',
          threshold: 255,
          direction: 'above',
          status: 'pending',
        }),
        feedback: {
          tone: 'info',
          title: 'Saved locally',
          message: "Saved locally. This alert will sync when you're back online.",
        },
      }),
    );
  });

  it('shows submit feedback and stays on the form when create fails online', async () => {
    route.params = { symbol: 'AAPL', currentPrice: 214.8 };
    alertsState.submitError = 'Duplicate request';
    alertsState.create = jest.fn().mockResolvedValue(false);

    renderWithTheme(<CreateAlertScreen />);

    fireEvent.changeText(screen.getByTestId('create-alert-target-input-text-field'), '220');

    await act(async () => {
      fireEvent.press(screen.getByTestId('create-alert-submit-button'));
    });

    expect(screen.getByText('Duplicate request')).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
