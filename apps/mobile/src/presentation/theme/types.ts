/** Light mode vs. dark mode identifier. */
export type ThemeMode = 'light' | 'dark';

/** Typography scale definition for a single text style. */
export interface TypographyStyle {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  lineHeight: number;
}

/** All typography tokens. */
export interface TypographyTokens {
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  h4: TypographyStyle;
  body: TypographyStyle;
  caption: TypographyStyle;
}

/** Theme-aware color palette. */
export interface ColorTokens {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  border: string;
  chartLine: string;
  chartFill: string;
}

/** Spacing scale (px values). */
export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/** Border-radius scale (px values). */
export interface RadiiTokens {
  sm: number;
  md: number;
  lg: number;
  full: number;
}

/**
 * Complete theme tokens — everything a component consumes
 * without hardcoding visual values.
 */
export interface ThemeTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radii: RadiiTokens;
}

/** Value exposed by ThemeContext and returned by useTheme(). */
export interface ThemeContextValue {
  mode: ThemeMode;
  tokens: ThemeTokens;
  toggle: () => void;
}
