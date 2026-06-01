import type {
  ColorTokens,
  ElevationTokens,
  LegacyRadiiTokens,
  RadiusTokens,
  SpacingTokens,
  ThemeTokens,
  TypographyStyle,
  TypographyTokens,
} from './types';

const inter = (
  fontSize: number,
  fontWeight: TypographyStyle['fontWeight'],
  lineHeight: number,
): TypographyStyle => ({
  fontFamily: 'Inter',
  fontSize,
  fontWeight,
  lineHeight,
});

const typographyBase: Omit<TypographyTokens, 'h4'> = {
  display: inter(32, '700', 40),
  h1: inter(28, '700', 34),
  h2: inter(24, '700', 30),
  h3: inter(20, '600', 28),
  title: inter(18, '600', 24),
  body: inter(16, '400', 24),
  bodySmall: inter(14, '400', 20),
  caption: inter(12, '500', 16),
  label: inter(13, '500', 18),
  button: inter(16, '600', 24),
};

export const typography: TypographyTokens = {
  ...typographyBase,
  h4: typographyBase.title,
};

export const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
};

export const radius: RadiusTokens = {
  input: 16,
  button: 16,
  card: 20,
  modal: 24,
  chip: 999,
};

export const radii: LegacyRadiiTokens = {
  sm: radius.input,
  md: radius.button,
  lg: radius.card,
  xl: radius.modal,
  full: radius.chip,
};

export const elevation: ElevationTokens = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  low: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  high: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

function createColors(mode: 'light' | 'dark'): ColorTokens {
  const brand = {
    navy: {
      900: '#111531',
      800: '#171D3D',
      700: '#222952',
    },
    coral: {
      400: '#F09A93',
      500: '#E6847E',
      600: '#D96F68',
    },
  } as const;

  const neutral = {
    0: '#F7F8FC',
    50: '#EFF1F7',
    100: '#D9DEEA',
    200: '#B8C0D4',
    300: '#8F99B2',
    400: '#6B738E',
    500: '#4B536D',
    700: '#2A3047',
    800: '#1D2237',
    900: '#14192B',
  } as const;

  const accent = {
    peach: {
      200: '#F9C7C0',
      300: '#F6B2AA',
    },
    indigo: {
      400: '#5565A3',
      500: '#3D4A84',
    },
  } as const;

  const semantic = {
    success: '#31C48D',
    warning: '#F5B14C',
    error: '#EF5F67',
    info: '#5EA5FF',
  } as const;

  const isDark = mode === 'dark';
  const bg = {
    canvas: isDark ? brand.navy[900] : neutral[50],
    surface: isDark ? brand.navy[800] : neutral[0],
    elevated: isDark ? brand.navy[700] : neutral[0],
    overlay: isDark ? 'rgba(17, 21, 49, 0.88)' : 'rgba(247, 248, 252, 0.92)',
  };
  const text = {
    primary: isDark ? neutral[0] : neutral[900],
    secondary: isDark ? neutral[100] : neutral[700],
    muted: isDark ? neutral[300] : neutral[500],
    inverse: isDark ? brand.navy[900] : neutral[0],
    accent: accent.indigo[400],
  };
  const border = {
    subtle: isDark ? neutral[700] : neutral[100],
    strong: isDark ? neutral[500] : neutral[300],
    accent: accent.indigo[400],
    danger: semantic.error,
  };
  const chart = {
    primary: brand.coral[500],
    secondary: accent.indigo[400],
    fill: isDark ? 'rgba(230, 132, 126, 0.18)' : 'rgba(230, 132, 126, 0.12)',
    grid: isDark ? neutral[700] : neutral[200],
    label: isDark ? neutral[300] : neutral[500],
  };

  return {
    brand,
    neutral,
    accent,
    semantic,
    bg,
    text,
    border,
    chart,
    primary: brand.coral[500],
    secondary: accent.indigo[500],
    background: bg.canvas,
    surface: bg.surface,
    textPrimary: text.primary,
    textSecondary: text.secondary,
    textMuted: text.muted,
    textInverse: text.inverse,
    textAccent: text.accent,
    error: semantic.error,
    success: semantic.success,
    warning: semantic.warning,
    info: semantic.info,
    borderColor: border.subtle,
    chartLine: chart.primary,
    chartFill: chart.fill,
  };
}

function createTheme(mode: 'light' | 'dark'): ThemeTokens {
  return {
    colors: createColors(mode),
    typography,
    spacing,
    radius,
    radii,
    elevation,
  };
}

export const darkTokens = createTheme('dark');
export const lightTokens = createTheme('light');
