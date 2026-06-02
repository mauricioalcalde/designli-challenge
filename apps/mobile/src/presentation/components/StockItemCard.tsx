import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';
import { Card } from './Card';
import { useTheme } from '../theme/useTheme';

interface StockItemCardProps {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  onPress: () => void;
  testID?: string;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatChangePercent(value: number): string {
  const icon = value >= 0 ? '▲' : '▼';
  return `${icon} ${Math.abs(value).toFixed(2)}%`;
}

function getInitials(symbol: string): string {
  return symbol.slice(0, 2).toUpperCase();
}

function getCompanyLogo(symbol: string): keyof typeof Ionicons.glyphMap | null {
  switch (symbol.toUpperCase()) {
    case 'AAPL':
      return 'logo-apple';
    case 'GOOGL':
    case 'GOOG':
      return 'logo-google';
    case 'AMZN':
      return 'logo-amazon';
    case 'MSFT':
      return 'logo-microsoft';
    default:
      return null;
  }
}

export function StockItemCard({
  symbol,
  name,
  price,
  changePercent,
  onPress,
  testID,
}: StockItemCardProps) {
  const { tokens } = useTheme();
  const isPositive = changePercent >= 0;
  const companyLogo = getCompanyLogo(symbol);

  return (
    <Card onPress={onPress} testID={testID}>
      <View style={styles.row}>
        <View style={styles.leftSide}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: tokens.colors.bg.elevated,
                borderColor: tokens.colors.border.subtle,
              },
            ]}
          >
            {companyLogo ? (
              <Ionicons name={companyLogo} size={20} color={tokens.colors.text.primary} />
            ) : (
              <Text
                style={{
                  color: tokens.colors.text.primary,
                  fontFamily: tokens.typography.caption.fontFamily,
                  fontSize: tokens.typography.caption.fontSize,
                  lineHeight: tokens.typography.caption.lineHeight,
                  fontWeight: '600',
                }}
              >
                {getInitials(symbol)}
              </Text>
            )}
          </View>

          <View style={styles.copy}>
            <Text
              style={{
                color: tokens.colors.text.primary,
                fontFamily: tokens.typography.title.fontFamily,
                fontSize: tokens.typography.title.fontSize,
                fontWeight: '700',
                lineHeight: tokens.typography.title.lineHeight,
              }}
            >
              {symbol}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                marginTop: tokens.spacing.xs,
                color: tokens.colors.text.secondary,
                fontFamily: tokens.typography.bodySmall.fontFamily,
                fontSize: tokens.typography.bodySmall.fontSize,
                fontWeight: tokens.typography.bodySmall.fontWeight,
                lineHeight: tokens.typography.bodySmall.lineHeight,
              }}
            >
              {name}
            </Text>
          </View>
        </View>

        <View style={styles.values}>
          <Text
            style={{
              color: tokens.colors.text.primary,
              fontFamily: tokens.typography.title.fontFamily,
              fontSize: tokens.typography.title.fontSize,
              fontWeight: tokens.typography.title.fontWeight,
              lineHeight: tokens.typography.title.lineHeight,
            }}
          >
            {formatPrice(price)}
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              text={formatChangePercent(changePercent)}
              variant={isPositive ? 'success' : 'error'}
            />
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={tokens.colors.text.muted}
          style={styles.chevron}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 72,
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  values: {
    alignItems: 'flex-end',
  },
  badgeRow: {
    marginTop: 8,
  },
  chevron: {
    marginLeft: 4,
  },
});
