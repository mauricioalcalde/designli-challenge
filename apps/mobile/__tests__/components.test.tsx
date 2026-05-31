import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

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

import { Button } from '../src/presentation/components/Button';
import { Card } from '../src/presentation/components/Card';
import { Badge } from '../src/presentation/components/Badge';
import { Input } from '../src/presentation/components/Input';
import { EmptyState } from '../src/presentation/components/EmptyState';
import { Skeleton } from '../src/presentation/components/Skeleton';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';

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
});
