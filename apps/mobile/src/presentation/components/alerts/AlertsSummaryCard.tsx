import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface AlertsSummaryCardProps {
  label: string;
  value: string;
  subtitle: string;
  accent?: string;
  testID?: string;
}

export function AlertsSummaryCard({ label, value, subtitle, accent, testID }: AlertsSummaryCardProps) {
  const { tokens } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border.subtle,
        },
      ]}
    >
      <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>{label}</Text>
      <Text style={[styles.value, { color: tokens.colors.text.primary }]}>{value}</Text>
      <Text style={[styles.subtitle, { color: accent ?? tokens.colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
