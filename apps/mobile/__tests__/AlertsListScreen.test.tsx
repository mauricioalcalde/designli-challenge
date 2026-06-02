import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AlertsListScreen } from '../src/presentation/screens/AlertsListScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';
import type { AlertsState } from '../src/application/alerts.store';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

const mockUseAlertsStore = jest.fn();
const mockUseRoute = jest.fn();
const mockUseNavigation = jest.fn();

jest.mock('../src/data/container', () => ({
  useAlertsStore: (selector: (state: AlertsState) => unknown) => mockUseAlertsStore(selector),
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
  useNavigation: () => mockUseNavigation(),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('AlertsListScreen', () => {
  let state: AlertsState;
  let route: {
    params?: {
      createdDraft?: {
        id: string;
        symbol: string;
        threshold: number;
        direction: 'above' | 'below';
        status: 'pending' | 'failed';
      };
      feedback?: {
        tone: 'success' | 'info' | 'error';
        title: string;
        message: string;
      };
    };
  };
  let navigation: { navigate: jest.Mock };

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

    route = { params: undefined };
    navigation = { navigate: jest.fn() };

    mockUseAlertsStore.mockImplementation((selector: (snapshot: AlertsState) => unknown) =>
      selector(state),
    );
    mockUseRoute.mockReturnValue(route);
    mockUseNavigation.mockReturnValue(navigation);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while the initial list request is pending', () => {
    state.isLoading = true;

    renderWithTheme(<AlertsListScreen />);

    expect(screen.getByTestId('alerts-list-loading-state')).toBeTruthy();
    expect(screen.getByText('Alerts')).toBeTruthy();
  });

  it('shows the premium empty state and create CTA when there are no alerts', () => {
    renderWithTheme(<AlertsListScreen />);

    expect(screen.getByTestId('alerts-list-empty-state')).toBeTruthy();
    expect(screen.getByText('No alerts yet. Create your first alert.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('alerts-list-empty-create-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('CreateAlert', undefined);
  });

  it('shows a retryable error state when alerts fail to load and there is no cached list', async () => {
    state.error = 'No internet connection';

    renderWithTheme(<AlertsListScreen />);

    expect(screen.getByTestId('alerts-list-error-state')).toBeTruthy();
    expect(screen.getByText('No internet connection')).toBeTruthy();
    expect(screen.queryByTestId('alerts-list-retry-button')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByTestId('alerts-list-error-content-action-button'));
    });

    expect(state.load).toHaveBeenCalledTimes(2);
  });

  it('renders active and triggered alerts with premium state badges', () => {
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
      {
        id: 2,
        userId: 7,
        symbol: 'MSFT',
        threshold: 400,
        direction: 'below',
        active: false,
        lastTriggeredAt: '2026-05-29T19:00:00.000Z',
        createdAt: '2026-05-29T18:05:00.000Z',
      },
    ];

    renderWithTheme(<AlertsListScreen />);

    expect(screen.getByTestId('alerts-list-state')).toBeTruthy();
    expect(screen.getByText('AAPL')).toBeTruthy();
    expect(screen.getByText('MSFT')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Triggered')).toBeTruthy();
  });

  it('shows relative timestamps for alert rows', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-30T12:00:00.000Z'));

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

    renderWithTheme(<AlertsListScreen />);

    expect(screen.getByTestId('alert-item-1-timestamp')).toBeTruthy();
    expect(screen.getByText('18h ago')).toBeTruthy();

    jest.useRealTimers();
  });

  it('triggers load on pull-to-refresh', () => {
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

    renderWithTheme(<AlertsListScreen />);

    expect(state.load).toHaveBeenCalledTimes(1);

    const scrollView = screen.getByTestId('alerts-list-scroll');
    const refreshControl = scrollView.props.refreshControl;
    expect(refreshControl).toBeTruthy();

    refreshControl.props.onRefresh();

    expect(state.load).toHaveBeenCalledTimes(2);
  });

  it('shows refresh spinner when reloading with cached alerts', () => {
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
    state.isLoading = true;

    renderWithTheme(<AlertsListScreen />);

    const scrollView = screen.getByTestId('alerts-list-scroll');
    const refreshControl = scrollView.props.refreshControl;
    expect(refreshControl.props.refreshing).toBe(true);
  });

  it('adds a pending-sync draft and offline success copy from navigation params', async () => {
    route.params = {
      createdDraft: {
        id: 'pending-aapl-180',
        symbol: 'AAPL',
        threshold: 180,
        direction: 'above',
        status: 'pending',
      },
      feedback: {
        tone: 'info',
        title: 'Saved locally',
        message: "Saved locally. This alert will sync when you're back online.",
      },
    };

    renderWithTheme(<AlertsListScreen />);

    await waitFor(() => {
      expect(screen.getByText('Pending sync')).toBeTruthy();
    });

    expect(screen.getByText('Saved locally')).toBeTruthy();
    expect(
      screen.getByText("Saved locally. This alert will sync when you're back online."),
    ).toBeTruthy();
  });

  it('renders a failed-sync local draft badge when params contain a failed alert', async () => {
    route.params = {
      createdDraft: {
        id: 'failed-nvda-950',
        symbol: 'NVDA',
        threshold: 950,
        direction: 'above',
        status: 'failed',
      },
    };

    renderWithTheme(<AlertsListScreen />);

    await waitFor(() => {
      expect(screen.getByText('Sync failed')).toBeTruthy();
    });

    expect(screen.getByText('NVDA')).toBeTruthy();
  });

  it('keeps delete behavior for server-backed alerts', () => {
    state.items = [
      {
        id: 3,
        userId: 7,
        symbol: 'TSLA',
        threshold: 250,
        direction: 'below',
        active: true,
        lastTriggeredAt: null,
        createdAt: '2026-05-29T18:10:00.000Z',
      },
    ];

    renderWithTheme(<AlertsListScreen />);

    fireEvent.press(screen.getByTestId('alert-item-delete-3'));

    expect(state.remove).toHaveBeenCalledWith(3);
  });
});
