import type {
  ColorTokens,
  RadiiTokens,
  SpacingTokens,
  ThemeTokens,
  TypographyTokens,
} from './types';

// ============================================================================
// Color palettes (light + dark)
// ============================================================================

const lightColors: ColorTokens = {
  primary: '#2563EB',
  secondary: '#7C3AED',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#F59E0B',
  info: '#0EA5E9',
  border: '#E5E7EB',
  chartLine: '#2563EB',
  chartFill: 'rgba(37, 99, 235, 0.1)',
};

const darkColors: ColorTokens = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#FBBF24',
  info: '#38BDF8',
  border: '#374151',
  chartLine: '#3B82F6',
  chartFill: 'rgba(59, 130, 246, 0.15)',
};

// ============================================================================
// Typography scale
// ============================================================================

const typography: TypographyTokens = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
};

// ============================================================================
// Spacing scale
// ============================================================================

const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ============================================================================
// Border-radius scale
// ============================================================================

const radii: RadiiTokens = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

// ============================================================================
// Full theme objects
// ============================================================================

export const lightTokens: ThemeTokens = {
  colors: lightColors,
  typography,
  spacing,
  radii,
};

export const darkTokens: ThemeTokens = {
  colors: darkColors,
  typography,
  spacing,
  radii,
};
