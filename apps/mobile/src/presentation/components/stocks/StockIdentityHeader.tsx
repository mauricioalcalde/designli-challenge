import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';

interface StockIdentityHeaderProps {
  symbol: string;
  name: string;
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

function getInitials(symbol: string): string {
  return symbol.slice(0, 2).toUpperCase();
}

export function StockIdentityHeader({ symbol, name }: StockIdentityHeaderProps) {
  const { tokens } = useTheme();
  const logo = getCompanyLogo(symbol);

  return (
    <View style={styles.wrapper} testID="stock-identity-header">
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: tokens.colors.bg.surface,
            borderColor: tokens.colors.border.subtle,
          },
        ]}
      >
        {logo ? (
          <Ionicons name={logo} size={28} color={tokens.colors.text.primary} />
        ) : (
          <Text
            style={{
              color: tokens.colors.text.primary,
              fontFamily: tokens.typography.title.fontFamily,
              fontSize: tokens.typography.title.fontSize,
              lineHeight: tokens.typography.title.lineHeight,
              fontWeight: '700',
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
            fontFamily: tokens.typography.h2.fontFamily,
            fontSize: tokens.typography.h2.fontSize,
            lineHeight: tokens.typography.h2.lineHeight,
            fontWeight: tokens.typography.h2.fontWeight,
          }}
        >
          {symbol}
        </Text>
        <Text
          style={{
            color: tokens.colors.text.secondary,
            fontFamily: tokens.typography.body.fontFamily,
            fontSize: tokens.typography.body.fontSize,
            lineHeight: tokens.typography.body.lineHeight,
          }}
        >
          {name}
        </Text>
        <View style={styles.chips}>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: tokens.colors.bg.surface,
                borderColor: tokens.colors.border.subtle,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: tokens.colors.text.secondary }]}>
              Technology
            </Text>
          </View>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: tokens.colors.bg.surface,
                borderColor: tokens.colors.border.subtle,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: tokens.colors.text.secondary }]}>US</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});
