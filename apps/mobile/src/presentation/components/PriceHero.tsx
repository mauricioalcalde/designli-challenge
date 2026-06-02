import { StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge';
import { Card } from './Card';
import { useTheme } from '../theme/useTheme';

interface PriceHeroProps {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  testID?: string;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatChangePercent(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function PriceHero({ symbol, name, price, changePercent, testID }: PriceHeroProps) {
  const { tokens } = useTheme();

  return (
    <Card testID={testID}>
      <View style={styles.content}>
        <Text
          style={{
            color: tokens.colors.text.muted,
            fontFamily: tokens.typography.caption.fontFamily,
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: tokens.typography.caption.fontWeight,
            lineHeight: tokens.typography.caption.lineHeight,
          }}
        >
          {symbol}
        </Text>
        <Text
          style={{
            color: tokens.colors.text.primary,
            fontFamily: tokens.typography.display.fontFamily,
            fontSize: tokens.typography.display.fontSize,
            fontWeight: tokens.typography.display.fontWeight,
            lineHeight: tokens.typography.display.lineHeight,
          }}
        >
          {formatPrice(price)}
        </Text>
        <Text
          style={{
            color: tokens.colors.text.secondary,
            fontFamily: tokens.typography.body.fontFamily,
            fontSize: tokens.typography.body.fontSize,
            fontWeight: tokens.typography.body.fontWeight,
            lineHeight: tokens.typography.body.lineHeight,
          }}
        >
          {name}
        </Text>
        <Badge text={formatChangePercent(changePercent)} variant={changePercent >= 0 ? 'success' : 'error'} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
  },
});
