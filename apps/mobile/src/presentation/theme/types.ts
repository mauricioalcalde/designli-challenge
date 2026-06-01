/** Light mode vs. dark mode identifier. */
export type ThemeMode = 'light' | 'dark';

export interface TypographyStyle {
  fontFamily: 'Inter';
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight: number;
}

export interface TypographyTokens {
  display: TypographyStyle;
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  title: TypographyStyle;
  body: TypographyStyle;
  bodySmall: TypographyStyle;
  caption: TypographyStyle;
  label: TypographyStyle;
  button: TypographyStyle;
  /** Backward-compatible alias for title. */
  h4: TypographyStyle;
}

export interface BrandNavyTokens {
  900: string;
  800: string;
  700: string;
}

export interface BrandCoralTokens {
  400: string;
  500: string;
  600: string;
}

export interface NeutralTokens {
  0: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  700: string;
  800: string;
  900: string;
}

export interface AccentTokens {
  peach: {
    200: string;
    300: string;
  };
  indigo: {
    400: string;
    500: string;
  };
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface BackgroundColors {
  canvas: string;
  surface: string;
  elevated: string;
  overlay: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  muted: string;
  inverse: string;
  accent: string;
}

export interface BorderColors {
  subtle: string;
  strong: string;
  accent: string;
  danger: string;
}

export interface ChartColors {
  primary: string;
  secondary: string;
  fill: string;
  grid: string;
  label: string;
}

export interface ColorTokens {
  brand: {
    navy: BrandNavyTokens;
    coral: BrandCoralTokens;
  };
  neutral: NeutralTokens;
  accent: AccentTokens;
  semantic: SemanticColors;
  bg: BackgroundColors;
  text: TextColors;
  border: BorderColors;
  chart: ChartColors;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textAccent: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  borderColor: string;
  chartLine: string;
  chartFill: string;
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
}

export interface RadiusTokens {
  input: number;
  button: number;
  card: number;
  modal: number;
  chip: number;
}

export interface LegacyRadiiTokens {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ElevationToken {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ElevationTokens {
  none: ElevationToken;
  low: ElevationToken;
  medium: ElevationToken;
  high: ElevationToken;
}

export interface ThemeTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  /** Backward-compatible alias while screens migrate. */
  radii: LegacyRadiiTokens;
  elevation: ElevationTokens;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  tokens: ThemeTokens;
  toggle: () => void;
}
