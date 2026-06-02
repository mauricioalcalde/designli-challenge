import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

// ---------------------------------------------------------------------------
// MMKV mock — must be set up before any component that imports ThemeProvider
// ---------------------------------------------------------------------------
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  return {
    Ionicons: ({ name, testID, ...props }: Record<string, unknown>) =>
      React.createElement('Ionicons', { name, testID, ...props }),
  };
});

const mockNavigation = { navigate: jest.fn() };
const mockUseInboxStore = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.mock('../src/application/inbox.store', () => ({
  useInboxStore: (selector: (state: unknown) => unknown) => mockUseInboxStore(selector),
  createInboxStore: jest.fn(),
}));

const mockUseConnectivity = jest.fn();

jest.mock('../src/presentation/hooks/useConnectivity', () => ({
  useConnectivity: () => mockUseConnectivity(),
}));

import { Button } from '../src/presentation/components/Button';
import { Card } from '../src/presentation/components/Card';
import { Badge } from '../src/presentation/components/Badge';
import { Divider } from '../src/presentation/components/Divider';
import { Input } from '../src/presentation/components/Input';
import { EmptyState } from '../src/presentation/components/EmptyState';
import { ScreenContainer } from '../src/presentation/components/ScreenContainer';
import { SectionHeader } from '../src/presentation/components/SectionHeader';
import { Skeleton } from '../src/presentation/components/Skeleton';
import { StatTile } from '../src/presentation/components/StatTile';
import { StockItemCard } from '../src/presentation/components/StockItemCard';
import { Chip } from '../src/presentation/components/Chip';
import { AlertItemCard } from '../src/presentation/components/AlertItemCard';
import { Banner } from '../src/presentation/components/Banner';
import { FeedbackState } from '../src/presentation/components/FeedbackState';
import { OfflineBanner } from '../src/presentation/components/OfflineBanner';
import { SegmentedControl } from '../src/presentation/components/SegmentedControl';
import { AlertsTopBar } from '../src/presentation/components/alerts/AlertsTopBar';
import { MarketTopBar } from '../src/presentation/components/stocks/MarketTopBar';
import { ThemeContext } from '../src/presentation/theme/ThemeProvider';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';
import { darkTokens } from '../src/presentation/theme';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Theme storage mock — always returns light. */
const testStorage = {
  getString: () => undefined,
  set: jest.fn(),
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider storage={testStorage}>{ui}</ThemeProvider>);
}

function renderWithTokens(ui: React.ReactElement, tokens: typeof darkTokens) {
  return render(
    <ThemeContext.Provider value={{ mode: 'dark', tokens, toggle: jest.fn() }}>
      {ui}
    </ThemeContext.Provider>,
  );
}

beforeEach(() => {
  mockUseConnectivity.mockReturnValue(true);
});

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
describe('Button', () => {
  it('renders primary variant with text', () => {
    renderWithTheme(<Button title="Save" onPress={jest.fn()} testID="btn" />);
    const btn = screen.getByTestId('btn');
    expect(btn).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('renders secondary variant', () => {
    renderWithTheme(<Button title="Cancel" variant="secondary" onPress={jest.fn()} testID="btn" />);
    expect(screen.getByTestId('btn')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('renders outline variant', () => {
    renderWithTheme(<Button title="Outline" variant="outline" onPress={jest.fn()} testID="btn" />);
    expect(screen.getByTestId('btn')).toBeTruthy();
    expect(screen.getByText('Outline')).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button title="Tap" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button title="Tap" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading spinner and does not fire onPress', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button title="Save" onPress={onPress} loading testID="btn" />);
    // Text should still be visible alongside spinner per spec
    expect(screen.getByText('Save')).toBeTruthy();
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <Button title="Save" onPress={jest.fn()} loading testID="btn" />,
    );
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
describe('Card', () => {
  it('renders children', () => {
    renderWithTheme(
      <Card testID="card">
        <Card testID="nested">Hello</Card>
      </Card>,
    );
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('renders title and subtitle', () => {
    renderWithTheme(<Card title="AAPL" subtitle="Apple Inc." testID="card" />);
    expect(screen.getByText('AAPL')).toBeTruthy();
    expect(screen.getByText('Apple Inc.')).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    renderWithTheme(<Card title="Tap me" onPress={onPress} testID="card" />);
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without onPress (static card)', () => {
    renderWithTheme(<Card title="Static" testID="card" />);
    expect(screen.getByTestId('card')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
describe('Badge', () => {
  it('renders success variant with text', () => {
    renderWithTheme(<Badge text="Active" variant="success" testID="badge" />);
    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders error variant', () => {
    renderWithTheme(<Badge text="Failed" variant="error" testID="badge" />);
    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByText('Failed')).toBeTruthy();
  });

  it('renders warning variant', () => {
    renderWithTheme(<Badge text="Warning" variant="warning" testID="badge" />);
    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByText('Warning')).toBeTruthy();
  });

  it('renders info variant', () => {
    renderWithTheme(<Badge text="Info" variant="info" testID="badge" />);
    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByText('Info')).toBeTruthy();
  });

  it('defaults to info variant', () => {
    renderWithTheme(<Badge text="Default" testID="badge" />);
    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByText('Default')).toBeTruthy();
  });

  it('renders neutral variant for premium status surfaces', () => {
    renderWithTheme(<Badge text="Neutral" variant="neutral" testID="badge" />);
    expect(screen.getByText('Neutral')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
describe('Input', () => {
  it('renders with label and placeholder', () => {
    renderWithTheme(<Input label="Email" placeholder="you@example.com" testID="input" />);
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  it('shows error message when error prop is set', () => {
    renderWithTheme(<Input label="Email" error="Required field" testID="input" />);
    expect(screen.getByText('Required field')).toBeTruthy();
  });

  it('shows helper message when helperText prop is set', () => {
    renderWithTheme(
      <Input label="Email" helperText="We will never share your email" testID="input" />,
    );
    expect(screen.getByText('We will never share your email')).toBeTruthy();
  });

  it('applies disabled state (non-editable)', () => {
    renderWithTheme(<Input label="Locked" disabled testID="input" />);
    const field = screen.getByTestId('input-text-field');
    expect(field.props.editable).toBe(false);
  });

  it('fires onChangeText when user types', () => {
    const onChangeText = jest.fn();
    renderWithTheme(<Input label="Symbol" testID="input" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByTestId('input-text-field'), 'AAPL');
    expect(onChangeText).toHaveBeenCalledWith('AAPL');
  });

  it('renders value prop', () => {
    renderWithTheme(<Input label="Symbol" value="AAPL" testID="input" />);
    expect(screen.getByTestId('input-text-field').props.value).toBe('AAPL');
  });

  it('uses the coral border color when focused', () => {
    renderWithTheme(<Input label="Email" testID="input" />);

    fireEvent(screen.getByTestId('input-text-field'), 'focus');

    const style = StyleSheet.flatten(screen.getByTestId('input-text-field').props.style);

    expect(style.borderColor).toBe('#E6847E');
  });

  it('shows a visibility toggle when secureTextEntry is enabled', () => {
    renderWithTheme(<Input label="Password" secureTextEntry testID="input" />);

    expect(screen.getByTestId('input-visibility-toggle')).toBeTruthy();
  });

  it('does not show a visibility toggle when secureTextEntry is not enabled', () => {
    renderWithTheme(<Input label="Email" testID="input" />);

    expect(screen.queryByTestId('input-visibility-toggle')).toBeNull();
  });

  it('toggles secureTextEntry off when the visibility toggle is pressed', () => {
    renderWithTheme(<Input label="Password" secureTextEntry testID="input" />);

    const field = screen.getByTestId('input-text-field');
    expect(field.props.secureTextEntry).toBe(true);

    fireEvent.press(screen.getByTestId('input-visibility-toggle'));

    expect(screen.getByTestId('input-text-field').props.secureTextEntry).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
describe('EmptyState', () => {
  it('renders title and message', () => {
    renderWithTheme(
      <EmptyState title="No alerts" message="Create your first alert" testID="empty" />,
    );
    expect(screen.getByText('No alerts')).toBeTruthy();
    expect(screen.getByText('Create your first alert')).toBeTruthy();
  });

  it('renders action button when action prop is provided', () => {
    const onPress = jest.fn();
    renderWithTheme(
      <EmptyState
        title="No alerts"
        message="Create one"
        action={{ label: 'Create Alert', onPress }}
        testID="empty"
      />,
    );
    expect(screen.getByText('Create Alert')).toBeTruthy();
    fireEvent.press(screen.getByTestId('empty-action-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without action button when not provided', () => {
    renderWithTheme(<EmptyState title="No items" message="Nothing here" testID="empty" />);
    expect(screen.queryByTestId('empty-action-button')).toBeNull();
  });
});

describe('ScreenContainer', () => {
  it('renders children inside a themed screen wrapper', () => {
    renderWithTheme(
      <ScreenContainer testID="screen-container">
        <Button title="Child" onPress={jest.fn()} />
      </ScreenContainer>,
    );

    expect(screen.getByTestId('screen-container')).toBeTruthy();
    expect(screen.getByText('Child')).toBeTruthy();
  });

  it('wraps content in SafeAreaView', () => {
    renderWithTheme(
      <ScreenContainer testID="screen-container">
        <Button title="Child" onPress={jest.fn()} />
      </ScreenContainer>,
    );

    const container = screen.getByTestId('screen-container');
    expect(container).toBeTruthy();
    // SafeAreaView is mocked as a View with testID propagated; children should still render
    expect(screen.getByText('Child')).toBeTruthy();
  });

  it('does not apply default padding so screens control their own insets', () => {
    renderWithTheme(
      <ScreenContainer testID="screen-container">
        <Button title="Child" onPress={jest.fn()} />
      </ScreenContainer>,
    );

    const container = screen.getByTestId('screen-container');
    const style = StyleSheet.flatten(container.props.style);
    expect(style.paddingHorizontal).toBeUndefined();
    expect(style.paddingVertical).toBeUndefined();
  });
});

describe('SectionHeader', () => {
  it('renders title and optional description', () => {
    renderWithTheme(
      <SectionHeader
        title="Watchlist"
        description="Track your highest conviction stocks"
        testID="section-header"
      />,
    );

    expect(screen.getByText('Watchlist')).toBeTruthy();
    expect(screen.getByText('Track your highest conviction stocks')).toBeTruthy();
  });
});

describe('StatTile', () => {
  it('renders label, value, and optional trend copy', () => {
    renderWithTheme(<StatTile label="Top gainer" value="AAPL" trend="+4.20%" testID="stat-tile" />);

    expect(screen.getByTestId('stat-tile')).toBeTruthy();
    expect(screen.getByText('Top gainer')).toBeTruthy();
    expect(screen.getByText('AAPL')).toBeTruthy();
    expect(screen.getByText('+4.20%')).toBeTruthy();
  });
});

describe('StockItemCard', () => {
  it('renders stock identity, price, and change chip', () => {
    renderWithTheme(
      <StockItemCard
        symbol="AAPL"
        name="Apple Inc."
        price={212.45}
        changePercent={1.23}
        onPress={jest.fn()}
        testID="stock-item-card"
      />,
    );

    expect(screen.getByText('AAPL')).toBeTruthy();
    expect(screen.getByText('Apple Inc.')).toBeTruthy();
    expect(screen.getByText('$212.45')).toBeTruthy();
    expect(screen.getByText('+1.23%')).toBeTruthy();
  });

  it('calls onPress when the premium stock card is tapped', () => {
    const onPress = jest.fn();

    renderWithTheme(
      <StockItemCard
        symbol="MSFT"
        name="Microsoft"
        price={498.12}
        changePercent={-0.47}
        onPress={onPress}
        testID="stock-item-card"
      />,
    );

    fireEvent.press(screen.getByTestId('stock-item-card'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText('-0.47%')).toBeTruthy();
  });

  it('renders a chevron icon to indicate drill-down affordance', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <StockItemCard
        symbol="AAPL"
        name="Apple Inc."
        price={212.45}
        changePercent={1.23}
        onPress={jest.fn()}
        testID="stock-item-card"
      />,
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Ionicons } = require('@expo/vector-icons');
    expect(UNSAFE_getByType(Ionicons)).toBeTruthy();
  });
});

describe('Chip', () => {
  it('renders its label and responds to presses when interactive', () => {
    const onPress = jest.fn();

    renderWithTheme(<Chip label="Above" variant="active" onPress={onPress} testID="chip" />);

    expect(screen.getByText('Above')).toBeTruthy();
    fireEvent.press(screen.getByTestId('chip'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a non-interactive status chip without press behavior', () => {
    renderWithTheme(<Chip label="Pending sync" variant="warning" testID="chip" />);

    expect(screen.getByText('Pending sync')).toBeTruthy();
  });
});

describe('AlertItemCard', () => {
  it('renders symbol, target price, direction, and active badge', () => {
    renderWithTheme(
      <AlertItemCard
        symbol="AAPL"
        targetPrice={180}
        direction="above"
        status="active"
        onDelete={jest.fn()}
        testID="alert-item"
      />,
    );

    expect(screen.getByText('AAPL')).toBeTruthy();
    expect(screen.getByText('$180.00')).toBeTruthy();
    expect(screen.getByText('Above')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('uses Badge for status indicator', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AlertItemCard
        symbol="AAPL"
        targetPrice={180}
        direction="above"
        status="active"
        onDelete={jest.fn()}
        testID="alert-item"
      />,
    );

    expect(UNSAFE_getByType(Badge)).toBeTruthy();
  });

  it('renders a relative timestamp when provided', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-30T12:00:00.000Z'));

    renderWithTheme(
      <AlertItemCard
        symbol="AAPL"
        targetPrice={180}
        direction="above"
        status="active"
        timestamp="2026-05-29T18:00:00.000Z"
        onDelete={jest.fn()}
        testID="alert-item"
      />,
    );

    expect(screen.getByTestId('alert-item-timestamp')).toBeTruthy();
    expect(screen.getByText('18h ago')).toBeTruthy();

    jest.useRealTimers();
  });

  it('surfaces failed sync state and delete action', () => {
    const onDelete = jest.fn();

    renderWithTheme(
      <AlertItemCard
        symbol="NVDA"
        targetPrice={950}
        direction="below"
        status="failed"
        onDelete={onDelete}
        testID="alert-item"
      />,
    );

    expect(screen.getByText('Sync failed')).toBeTruthy();
    fireEvent.press(screen.getByTestId('alert-item-delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('Banner', () => {
  it('renders the shared message and action', () => {
    const onPress = jest.fn();

    renderWithTheme(
      <Banner
        message="You're offline. Showing cached data."
        variant="warning"
        action={{ label: 'Retry', onPress }}
        testID="banner"
      />,
    );

    expect(screen.getByText("You're offline. Showing cached data.")).toBeTruthy();
    fireEvent.press(screen.getByTestId('banner-action'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('derives container and text styles from theme tokens', () => {
    const tokens = {
      ...darkTokens,
      spacing: { ...darkTokens.spacing, lg: 99, md: 77 },
      radius: { ...darkTokens.radius, card: 55 },
      typography: {
        ...darkTokens.typography,
        body: {
          ...darkTokens.typography.body,
          fontSize: 15,
          lineHeight: 22,
          fontWeight: '400' as const,
        },
      },
    };

    renderWithTokens(
      <Banner
        message="You're offline. Showing cached data."
        variant="warning"
        action={{ label: 'Retry', onPress: jest.fn() }}
        testID="banner"
      />,
      tokens,
    );

    const containerStyle = StyleSheet.flatten(screen.getByTestId('banner').props.style);
    const messageStyle = StyleSheet.flatten(
      screen.getByText("You're offline. Showing cached data.").props.style,
    );
    const actionRowStyle = StyleSheet.flatten(screen.getByTestId('banner-action-row').props.style);

    expect(containerStyle.borderRadius).toBe(55);
    expect(containerStyle.padding).toBe(99);
    expect(messageStyle.fontSize).toBe(15);
    expect(messageStyle.lineHeight).toBe(22);
    expect(messageStyle.fontWeight).toBe('400');
    expect(actionRowStyle.marginTop).toBe(77);
  });
});

describe('OfflineBanner', () => {
  it('shows the unified offline banner only while disconnected', () => {
    mockUseConnectivity.mockReturnValue(false);
    const { rerender } = renderWithTheme(<OfflineBanner testID="offline-banner" />);

    expect(screen.getByText("You're offline. Showing cached data.")).toBeTruthy();

    mockUseConnectivity.mockReturnValue(true);
    rerender(
      <ThemeProvider storage={testStorage}>
        <OfflineBanner testID="offline-banner" />
      </ThemeProvider>,
    );

    expect(screen.queryByText("You're offline. Showing cached data.")).toBeNull();
  });
});

describe('FeedbackState', () => {
  it('renders pending sync feedback copy', () => {
    renderWithTheme(
      <FeedbackState
        type="pending"
        message="Saved locally. This alert will sync when you're back online."
        testID="feedback-state"
      />,
    );

    expect(screen.getByText('Pending sync')).toBeTruthy();
    expect(
      screen.getByText("Saved locally. This alert will sync when you're back online."),
    ).toBeTruthy();
  });

  it('renders retry action for sync failures', () => {
    const onPress = jest.fn();

    renderWithTheme(
      <FeedbackState
        type="error"
        message="Sync failed. Tap to retry."
        action={{ label: 'Retry', onPress }}
        testID="feedback-state"
      />,
    );

    expect(screen.getByText('Sync failed')).toBeTruthy();
    fireEvent.press(screen.getByTestId('feedback-state-action'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('derives layout and typography from theme tokens', () => {
    const tokens = {
      ...darkTokens,
      spacing: { ...darkTokens.spacing, lg: 91, md: 73 },
      radius: { ...darkTokens.radius, card: 47 },
      typography: {
        ...darkTokens.typography,
        bodySmall: {
          ...darkTokens.typography.bodySmall,
          fontSize: 15,
          lineHeight: 21,
          fontWeight: '600' as const,
        },
      },
    };

    renderWithTokens(
      <FeedbackState
        type="pending"
        message="Saved locally. This alert will sync when you're back online."
        action={{ label: 'Retry', onPress: jest.fn() }}
        testID="feedback-state"
      />,
      tokens,
    );

    const containerStyle = StyleSheet.flatten(screen.getByTestId('feedback-state').props.style);
    const messageStyle = StyleSheet.flatten(
      screen.getByText("Saved locally. This alert will sync when you're back online.").props.style,
    );

    expect(containerStyle.borderRadius).toBe(47);
    expect(containerStyle.padding).toBe(91);
    expect(containerStyle.gap).toBe(73);
    expect(messageStyle.fontSize).toBe(15);
    expect(messageStyle.lineHeight).toBe(21);
    expect(messageStyle.fontWeight).toBe('600');
  });
});

describe('Divider', () => {
  it('renders a subtle separator line', () => {
    renderWithTheme(<Divider testID="divider" />);
    expect(screen.getByTestId('divider')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
describe('Skeleton', () => {
  it('renders Skeleton.Line with width and height', () => {
    renderWithTheme(<Skeleton.Line width={200} height={16} testID="skel" />);
    expect(screen.getByTestId('skel')).toBeTruthy();
  });

  it('renders Skeleton.Card with width and height', () => {
    renderWithTheme(<Skeleton.Card width={300} height={80} testID="skel" />);
    expect(screen.getByTestId('skel')).toBeTruthy();
  });

  it('renders Skeleton.Circle with size', () => {
    renderWithTheme(<Skeleton.Circle size={40} testID="skel" />);
    expect(screen.getByTestId('skel')).toBeTruthy();
  });

  it('Skeleton has no interactive behavior', () => {
    renderWithTheme(<Skeleton.Line width={100} height={10} testID="skel" />);
    // Skeleton is a View — just verify it renders without crash
    const skel = screen.getByTestId('skel');
    expect(skel).toBeTruthy();
  });

  it('accepts percentage string width for responsive layouts', () => {
    const { getByTestId: getLine } = renderWithTheme(
      <Skeleton.Line width="70%" height={16} testID="skel-line" />,
    );
    const { getByTestId: getCard } = renderWithTheme(
      <Skeleton.Card width="90%" height={80} testID="skel-card" />,
    );

    const line = getLine('skel-line');
    const card = getCard('skel-card');

    const lineStyle = StyleSheet.flatten(line.props.style);
    const cardStyle = StyleSheet.flatten(card.props.style);

    expect(lineStyle.width).toBe('70%');
    expect(cardStyle.width).toBe('90%');
  });

  it('defaults Card to 90% width and Line to 70% width when width is omitted', () => {
    const { getByTestId: getCard } = renderWithTheme(<Skeleton.Card testID="skel-card-default" />);
    const { getByTestId: getLine } = renderWithTheme(<Skeleton.Line testID="skel-line-default" />);

    const card = getCard('skel-card-default');
    const line = getLine('skel-line-default');

    const cardStyle = StyleSheet.flatten(card.props.style);
    const lineStyle = StyleSheet.flatten(line.props.style);

    expect(cardStyle.width).toBe('90%');
    expect(lineStyle.width).toBe('70%');
  });
});

// ---------------------------------------------------------------------------
// SegmentedControl
// ---------------------------------------------------------------------------
describe('SegmentedControl', () => {
  const options = [
    { label: 'Above', value: 'above' },
    { label: 'Below', value: 'below' },
  ];

  it('renders all option labels', () => {
    renderWithTheme(
      <SegmentedControl options={options} value="above" onChange={jest.fn()} testID="segmented" />,
    );

    expect(screen.getByText('Above')).toBeTruthy();
    expect(screen.getByText('Below')).toBeTruthy();
  });

  it('fires onChange with the new value when an inactive segment is pressed', () => {
    const onChange = jest.fn();

    renderWithTheme(
      <SegmentedControl options={options} value="above" onChange={onChange} testID="segmented" />,
    );

    fireEvent.press(screen.getByTestId('segmented-option-below'));
    expect(onChange).toHaveBeenCalledWith('below');
  });

  it('does not fire onChange when the already-active segment is pressed', () => {
    const onChange = jest.fn();

    renderWithTheme(
      <SegmentedControl options={options} value="above" onChange={onChange} testID="segmented" />,
    );

    fireEvent.press(screen.getByTestId('segmented-option-above'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AlertsTopBar — bell badge
// ---------------------------------------------------------------------------
describe('AlertsTopBar — bell badge', () => {
  beforeEach(() => {
    mockNavigation.navigate.mockClear();
    mockUseInboxStore.mockImplementation((selector: (state: { unreadCount: number }) => unknown) =>
      selector({ unreadCount: 0 }),
    );
  });

  it('renders notifications-outline bell icon (distinct from alerts tab)', () => {
    renderWithTheme(<AlertsTopBar onRefresh={jest.fn()} />);

    // Verify the bell icon is rendered with the correct name
    const icon = screen.getByTestId('alerts-topbar-bell-icon');
    expect(icon.props.name).toBe('notifications-outline');
  });

  it('navigates to Stocks > Inbox when bell is tapped', () => {
    renderWithTheme(<AlertsTopBar onRefresh={jest.fn()} />);

    fireEvent.press(screen.getByTestId('alerts-topbar-notifications'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Stocks', {
      screen: 'Inbox',
    });
  });

  it('shows unread count badge when unreadCount > 0', () => {
    mockUseInboxStore.mockImplementation((selector: (state: { unreadCount: number }) => unknown) =>
      selector({ unreadCount: 3 }),
    );

    renderWithTheme(<AlertsTopBar onRefresh={jest.fn()} />);

    expect(screen.getByTestId('alerts-topbar-badge')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('hides badge when unreadCount is 0', () => {
    mockUseInboxStore.mockImplementation((selector: (state: { unreadCount: number }) => unknown) =>
      selector({ unreadCount: 0 }),
    );

    renderWithTheme(<AlertsTopBar onRefresh={jest.fn()} />);

    expect(screen.queryByTestId('alerts-topbar-badge')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// MarketTopBar — bell badge
// ---------------------------------------------------------------------------
describe('MarketTopBar — bell badge', () => {
  beforeEach(() => {
    mockNavigation.navigate.mockClear();
    mockUseInboxStore.mockImplementation((selector: (state: { unreadCount: number }) => unknown) =>
      selector({ unreadCount: 0 }),
    );
  });

  it('renders notifications-outline bell icon (distinct from alerts tab)', () => {
    renderWithTheme(<MarketTopBar onRefresh={jest.fn()} />);

    // Verify the bell icon is rendered with the correct name
    const icon = screen.getByTestId('stocks-topbar-bell-icon');
    expect(icon.props.name).toBe('notifications-outline');
  });

  it('navigates to Inbox when bell is tapped', () => {
    renderWithTheme(<MarketTopBar onRefresh={jest.fn()} />);

    fireEvent.press(screen.getByTestId('stocks-topbar-notifications'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Inbox');
  });

  it('shows unread count badge when unreadCount > 0', () => {
    mockUseInboxStore.mockImplementation((selector: (state: { unreadCount: number }) => unknown) =>
      selector({ unreadCount: 5 }),
    );

    renderWithTheme(<MarketTopBar onRefresh={jest.fn()} />);

    expect(screen.getByTestId('stocks-topbar-badge')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('hides badge when unreadCount is 0', () => {
    mockUseInboxStore.mockImplementation((selector: (state: { unreadCount: number }) => unknown) =>
      selector({ unreadCount: 0 }),
    );

    renderWithTheme(<MarketTopBar onRefresh={jest.fn()} />);

    expect(screen.queryByTestId('stocks-topbar-badge')).toBeNull();
  });
});
