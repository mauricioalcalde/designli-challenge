import React from 'react';
import { Button, Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
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
      <Text testID="bg-color">{tokens.colors.background}</Text>
      <Text testID="text-color">{tokens.colors.text}</Text>
      <Text testID="primary-color">{tokens.colors.primary}</Text>
      <Text testID="spacing-md">{tokens.spacing.md}</Text>
      <Text testID="h1-size">{tokens.typography.h1.fontSize}</Text>
      <Text testID="radius-sm">{tokens.radii.sm}</Text>
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
  it('renders children and provides light theme tokens by default', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    // Mode defaults to light
    expect(screen.getByTestId('mode').props.children).toBe('light');

    // Light palette: background is white, text is dark
    expect(screen.getByTestId('bg-color').props.children).toBe('#FFFFFF');
    expect(screen.getByTestId('text-color').props.children).toBe('#111827');
    expect(screen.getByTestId('primary-color').props.children).toBe('#2563EB');

    // Spacing token
    expect(screen.getByTestId('spacing-md').props.children).toBe(16);

    // Typography token — h1 fontSize > body
    expect(screen.getByTestId('h1-size').props.children).toBe(28);

    // Radii token
    expect(screen.getByTestId('radius-sm').props.children).toBe(4);
  });

  // ----- Toggle light → dark -----
  it('toggle switches from light to dark and updates all tokens', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('light');
    expect(screen.getByTestId('bg-color').props.children).toBe('#FFFFFF');

    // Toggle to dark
    fireEvent.press(screen.getByTestId('toggle-btn'));

    expect(screen.getByTestId('mode').props.children).toBe('dark');
    // Dark palette: background is dark, text is light
    expect(screen.getByTestId('bg-color').props.children).toBe('#121212');
    expect(screen.getByTestId('text-color').props.children).toBe('#F9FAFB');
  });

  // ----- Toggle dark → light -----
  it('toggle switches from dark back to light', () => {
    // Pre-set MMKV so ThemeProvider hydrates to dark
    mmkvStore['theme_preference'] = 'dark';

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('dark');

    fireEvent.press(screen.getByTestId('toggle-btn'));

    expect(screen.getByTestId('mode').props.children).toBe('light');
    expect(screen.getByTestId('bg-color').props.children).toBe('#FFFFFF');
  });

  // ----- MMKV persistence on toggle -----
  it('persists theme preference to MMKV on toggle', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    // Default: nothing saved yet or light
    fireEvent.press(screen.getByTestId('toggle-btn'));

    // After toggle to dark, MMKV should have 'dark'
    expect(mmkvStore['theme_preference']).toBe('dark');

    // Toggle again back to light
    fireEvent.press(screen.getByTestId('toggle-btn'));
    expect(mmkvStore['theme_preference']).toBe('light');
  });

  // ----- Hydration: dark mode persists across "restarts" -----
  it('hydrates dark mode from MMKV on mount', () => {
    // Simulate a previous session saved dark
    mmkvStore['theme_preference'] = 'dark';

    const { unmount } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('dark');
    expect(screen.getByTestId('bg-color').props.children).toBe('#121212');

    unmount();

    // "Restart" — re-mount with MMKV still holding 'dark'
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('dark');
  });

  // ----- First launch: no stored preference → light -----
  it('defaults to light when no preference is stored', () => {
    // Ensure MMKV is empty
    delete mmkvStore['theme_preference'];

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('light');
  });

  // ----- Error when used outside provider -----
  it('throws when useTheme is called outside ThemeProvider', () => {
    // Suppress console.error for this expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within a ThemeProvider');

    spy.mockRestore();
  });

  // ----- Two toggles cycle correctly -----
  it('cycles light → dark → light with two toggles', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('mode').props.children).toBe('dark');

    fireEvent.press(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('mode').props.children).toBe('light');
  });

  // ----- Tokens are correctly typed and present -----
  it('exposes all token groups from useTheme', () => {
    function TokenInspector() {
      const { tokens } = useTheme();

      return (
        <View>
          <Text testID="has-colors">{Object.keys(tokens.colors).length > 0 ? 'yes' : 'no'}</Text>
          <Text testID="has-typography">
            {Object.keys(tokens.typography).length > 0 ? 'yes' : 'no'}
          </Text>
          <Text testID="has-spacing">{Object.keys(tokens.spacing).length > 0 ? 'yes' : 'no'}</Text>
          <Text testID="has-radii">{Object.keys(tokens.radii).length > 0 ? 'yes' : 'no'}</Text>
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
    expect(screen.getByTestId('has-radii').props.children).toBe('yes');
  });

  // ----- Dark mode tokens are different from light -----
  it('provides different color tokens for dark vs light mode', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    const lightBg = screen.getByTestId('bg-color').props.children;
    const lightText = screen.getByTestId('text-color').props.children;

    fireEvent.press(screen.getByTestId('toggle-btn'));

    const darkBg = screen.getByTestId('bg-color').props.children;
    const darkText = screen.getByTestId('text-color').props.children;

    expect(lightBg).not.toBe(darkBg);
    expect(lightText).not.toBe(darkText);
  });
});
