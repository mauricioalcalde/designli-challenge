import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface MarketSummaryCardProps {
  label: string;
  value: string;
  accent?: string;
  footer?: string;
  testID?: string;
}

export function MarketSummaryCard({
  label,
  value,
  accent,
  footer,
  testID,
}: MarketSummaryCardProps) {
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
      <Text
        style={{
          color: tokens.colors.text.secondary,
          fontFamily: tokens.typography.caption.fontFamily,
          fontSize: tokens.typography.caption.fontSize,
          lineHeight: tokens.typography.caption.lineHeight,
          fontWeight: tokens.typography.caption.fontWeight,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: tokens.colors.text.primary,
          fontFamily: tokens.typography.h3.fontFamily,
          fontSize: tokens.typography.h3.fontSize,
          lineHeight: tokens.typography.h3.lineHeight,
          fontWeight: tokens.typography.h3.fontWeight,
        }}
      >
        {value}
      </Text>

      {footer ? (
        <Text
          style={{
            color: accent ?? tokens.colors.text.secondary,
            fontFamily: tokens.typography.caption.fontFamily,
            fontSize: tokens.typography.caption.fontSize,
            lineHeight: tokens.typography.caption.lineHeight,
            fontWeight: '600',
          }}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
});
