import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { useTheme } from '../theme/useTheme';

interface StatTileProps {
  label: string;
  value: string;
  trend?: string;
  testID?: string;
}

export function StatTile({ label, value, trend, testID }: StatTileProps) {
  const { tokens } = useTheme();
  const trendColor = trend?.startsWith('-') ? tokens.colors.error : tokens.colors.primary;

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
          {label}
        </Text>
        <Text
          style={{
            color: tokens.colors.text.primary,
            fontFamily: tokens.typography.title.fontFamily,
            fontSize: tokens.typography.title.fontSize,
            fontWeight: tokens.typography.title.fontWeight,
            lineHeight: tokens.typography.title.lineHeight,
          }}
        >
          {value}
        </Text>
        {trend ? (
          <Text
            style={{
              color: trendColor,
              fontFamily: tokens.typography.caption.fontFamily,
              fontSize: tokens.typography.caption.fontSize,
              fontWeight: '700',
              lineHeight: tokens.typography.caption.lineHeight,
            }}
          >
            {trend}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    minWidth: 140,
  },
});
