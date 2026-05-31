import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { darkTokens, lightTokens } from './tokens';
import type { ThemeContextValue, ThemeMode } from './types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// MMKV key
// ---------------------------------------------------------------------------

const THEME_KEY = 'theme_preference';

// ---------------------------------------------------------------------------
// Storage interface (enables test injection)
// ---------------------------------------------------------------------------

export interface ThemeStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
}

function createDefaultStorage(): ThemeStorage {
  const mmkv = createMMKV();
  return {
    getString: (key) => mmkv.getString(key),
    set: (key, value) => mmkv.set(key, value),
  };
}

function readPersistedMode(storage: ThemeStorage): ThemeMode {
  const saved = storage.getString(THEME_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode;
  /** Inject a custom storage for testing. Defaults to MMKV. */
  storage?: ThemeStorage;
}

export function ThemeProvider({ children, storage }: ThemeProviderProps) {
  const s = storage ?? createDefaultStorage();

  const [mode, setMode] = useState<ThemeMode>(() => readPersistedMode(s));

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      s.set(THEME_KEY, next);
      return next;
    });
  }, [s]);

  const tokens = useMemo(() => (mode === 'light' ? lightTokens : darkTokens), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, tokens, toggle }),
    [mode, tokens, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
