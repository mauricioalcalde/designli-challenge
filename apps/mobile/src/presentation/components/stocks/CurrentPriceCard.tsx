import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '../Badge';
import { useTheme } from '../../theme/useTheme';

interface CurrentPriceCardProps {
  price: number;
  changeLabel: string;
  isPositive: boolean;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function CurrentPriceCard({ price, changeLabel, isPositive }: CurrentPriceCardProps) {
  const { tokens } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border.subtle,
        },
      ]}
      testID="stock-current-price-card"
    >
      <Text
        style={{
          color: tokens.colors.text.muted,
          fontFamily: tokens.typography.caption.fontFamily,
          fontSize: tokens.typography.caption.fontSize,
          lineHeight: tokens.typography.caption.lineHeight,
          fontWeight: tokens.typography.caption.fontWeight,
        }}
      >
        Current price
      </Text>

      <Text
        style={{
          color: tokens.colors.text.primary,
          fontFamily: tokens.typography.display.fontFamily,
          fontSize: 32,
          lineHeight: 38,
          fontWeight: '700',
        }}
      >
        {formatPrice(price)}
      </Text>

      <Badge
        text={changeLabel}
        variant={isPositive ? 'success' : 'error'}
        testID="stock-current-change-badge"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
});
