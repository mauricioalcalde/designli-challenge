import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface RangeStatsRowProps {
  open: number;
  high: number;
  low: number;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function StatColumn({ label, value }: { label: string; value: string }) {
  const { tokens } = useTheme();
  return (
    <View style={styles.column}>
      <Text style={[styles.label, { color: tokens.colors.text.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: tokens.colors.text.primary }]}>{value}</Text>
    </View>
  );
}

export function RangeStatsRow({ open, high, low }: RangeStatsRowProps) {
  return (
    <View style={styles.row} testID="stock-range-stats-row">
      <StatColumn label="Open" value={formatPrice(open)} />
      <StatColumn label="High" value={formatPrice(high)} />
      <StatColumn label="Low" value={formatPrice(low)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
