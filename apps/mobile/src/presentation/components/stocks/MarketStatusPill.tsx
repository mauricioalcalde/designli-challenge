import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { formatTimeOnly } from '../../utils/time-format';

export interface MarketStatusPillProps {
  isBackgroundRefreshing: boolean;
  isStale: boolean;
  isOffline: boolean;
  lastUpdatedAt: string | null;
  staleReason?: 'network' | 'provider' | 'unknown' | null;
}

function lastUpdatedLabel(iso: string): string {
  return `Updated ${formatTimeOnly(iso)}`;
}

/**
 * Subtle status pill shown in the Stocks header area.
 * Never shows a full spinner — only short text like:
 *   "Live · Updated 11:22"
 *   "Updating…"
 *   "Offline · Cached data"
 *   "Refresh failed · Showing latest cached data"
 */
export function MarketStatusPill({
  isBackgroundRefreshing,
  isStale,
  isOffline,
  lastUpdatedAt,
  staleReason: _staleReason,
}: MarketStatusPillProps) {
  const { tokens } = useTheme();

  if (!lastUpdatedAt && !isBackgroundRefreshing && !isStale && !isOffline) {
    return null;
  }

  let label: string;
  let color: string;

  if (isOffline) {
    label = 'Offline · Cached data';
    color = tokens.colors.warning;
  } else if (isBackgroundRefreshing) {
    label = 'Updating…';
    color = tokens.colors.text.muted;
  } else if (isStale) {
    label = 'Refresh failed · Showing latest cached data';
    color = tokens.colors.warning;
  } else if (lastUpdatedAt) {
    label = `Live · ${lastUpdatedLabel(lastUpdatedAt)}`;
    color = tokens.colors.success;
  } else {
    label = 'Live';
    color = tokens.colors.success;
  }

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: tokens.colors.bg.surface, borderColor: tokens.colors.border.subtle },
      ]}
      testID="stocks-status-pill"
    >
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
