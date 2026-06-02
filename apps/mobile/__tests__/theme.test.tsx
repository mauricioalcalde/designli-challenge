import React from 'react';
import { Button, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';
import { useTheme } from '../src/presentation/theme/useTheme';

// ---------------------------------------------------------------------------
// MMKV mock — persists in-memory so we can assert reads & writes
// ---------------------------------------------------------------------------
const mmkvStore: Record<string, string> = {};

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: (key: string) => mmkvStore[key],
    set: (key: string, value: string) => {
      mmkvStore[key] = value;
    },
    remove: (key: string) => {
      delete mmkvStore[key];
    },
  }),
}));

// ---------------------------------------------------------------------------
// Consumer component to exercise useTheme inside ThemeProvider
// ---------------------------------------------------------------------------
function ThemeConsumer() {
  const { mode, tokens, toggle } = useTheme();

  return (
    <View testID="theme-consumer">
      <Text testID="mode">{mode}</Text>
      <Text testID="bg-color">{tokens.colors.bg.canvas}</Text>
      <Text testID="surface-color">{tokens.colors.bg.surface}</Text>
      <Text testID="text-color">{tokens.colors.text.primary}</Text>
      <Text testID="primary-color">{tokens.colors.primary}</Text>
      <Text testID="brand-coral">{tokens.colors.brand.coral[500]}</Text>
      <Text testID="brand-navy">{tokens.colors.brand.navy[900]}</Text>
      <Text testID="spacing-md">{tokens.spacing.md}</Text>
      <Text testID="spacing-5xl">{tokens.spacing['5xl']}</Text>
      <Text testID="display-size">{tokens.typography.display.fontSize}</Text>
      <Text testID="button-font">{tokens.typography.button.fontFamily}</Text>
      <Text testID="radius-card">{tokens.radius.card}</Text>
      <Text testID="radius-chip">{tokens.radius.chip}</Text>
      <Text testID="elevation-medium">{tokens.elevation.medium.elevation}</Text>
      <Button testID="toggle-btn" title="Toggle" onPress={toggle} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ThemeProvider & useTheme', () => {
  beforeEach(() => {
    // Clear the mock MMKV store between tests
    Object.keys(mmkvStore).forEach((k) => delete mmkvStore[k]);
  });

  // ----- Rendering & default mode -----
  it('renders children and provides premium dark theme tokens by default', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('dark');
    expect(screen.getByTestId('bg-color').props.children).toBe('#111531');
    expect(screen.getByTestId('surface-color').props.children).toBe('#171D3D');
    expect(screen.getByTestId('text-color').props.children).toBe('#F7F8FC');
    expect(screen.getByTestId('primary-color').props.children).toBe('#E6847E');
    expect(screen.getByTestId('brand-coral').props.children).toBe('#E6847E');
    expect(screen.getByTestId('brand-navy').props.children).toBe('#111531');
    expect(screen.getByTestId('spacing-md').props.children).toBe(12);
    expect(screen.getByTestId('spacing-5xl').props.children).toBe(48);
    expect(screen.getByTestId('display-size').props.children).toBe(32);
    expect(screen.getByTestId('button-font').props.children).toBe('Inter');
    expect(screen.getByTestId('radius-card').props.children).toBe(18);
    expect(screen.getByTestId('radius-chip').props.children).toBe(999);
    expect(screen.getByTestId('elevation-medium').props.children).toBe(4);
  });

  it('toggle switches from dark to light and updates semantic surfaces', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('dark');
    expect(screen.getByTestId('bg-color').props.children).toBe('#111531');

    fireEvent.press(screen.getByTestId('toggle-btn'));

    expect(screen.getByTestId('mode').props.children).toBe('light');
    expect(screen.getByTestId('bg-color').props.children).not.toBe('#111531');
    expect(screen.getByTestId('text-color').props.children).not.toBe('#F7F8FC');
  });

  it('hydrates light mode from MMKV when explicitly persisted', () => {
    mmkvStore['theme_preference'] = 'light';

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('light');
    expect(screen.getByTestId('brand-coral').props.children).toBe('#E6847E');
  });

  it('persists theme preference to MMKV on toggle', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByTestId('toggle-btn'));
    expect(mmkvStore['theme_preference']).toBe('light');

    fireEvent.press(screen.getByTestId('toggle-btn'));
    expect(mmkvStore['theme_preference']).toBe('dark');
  });

  it('hydrates dark mode from MMKV on mount', () => {
    mmkvStore['theme_preference'] = 'dark';

    const { unmount } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('dark');
    expect(screen.getByTestId('bg-color').props.children).toBe('#111531');

    unmount();

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('dark');
  });

  it('defaults to dark when no preference is stored', () => {
    delete mmkvStore['theme_preference'];

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('dark');
  });

  it('throws when useTheme is called outside ThemeProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within a ThemeProvider');

    spy.mockRestore();
  });

  it('cycles dark → light → dark with two toggles', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('mode').props.children).toBe('light');

    fireEvent.press(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('mode').props.children).toBe('dark');
  });

  it('exposes all premium token groups from useTheme', () => {
    function TokenInspector() {
      const { tokens } = useTheme();

      return (
        <View>
          <Text testID="has-colors">
            {Object.keys(tokens.colors.brand).length > 0 ? 'yes' : 'no'}
          </Text>
          <Text testID="has-typography">
            {Object.keys(tokens.typography).length > 0 ? 'yes' : 'no'}
          </Text>
          <Text testID="has-spacing">{Object.keys(tokens.spacing).length > 0 ? 'yes' : 'no'}</Text>
          <Text testID="has-radius">{Object.keys(tokens.radius).length > 0 ? 'yes' : 'no'}</Text>
          <Text testID="has-elevation">
            {Object.keys(tokens.elevation).length > 0 ? 'yes' : 'no'}
          </Text>
        </View>
      );
    }

    render(
      <ThemeProvider>
        <TokenInspector />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('has-colors').props.children).toBe('yes');
    expect(screen.getByTestId('has-typography').props.children).toBe('yes');
    expect(screen.getByTestId('has-spacing').props.children).toBe('yes');
    expect(screen.getByTestId('has-radius').props.children).toBe('yes');
    expect(screen.getByTestId('has-elevation').props.children).toBe('yes');
  });

  it('keeps Inter typography roles available across theme modes', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('button-font').props.children).toBe('Inter');

    fireEvent.press(screen.getByTestId('toggle-btn'));

    expect(screen.getByTestId('button-font').props.children).toBe('Inter');
  });
});
