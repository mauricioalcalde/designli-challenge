import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { useTheme } from '../theme/useTheme';

interface ChartCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  testID?: string;
}

export function ChartCard({ title, subtitle, children, testID }: ChartCardProps) {
  const { tokens } = useTheme();

  return (
    <Card testID={testID}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text
            style={{
              color: tokens.colors.text.primary,
              fontFamily: tokens.typography.title.fontFamily,
              fontSize: tokens.typography.title.fontSize,
              fontWeight: tokens.typography.title.fontWeight,
              lineHeight: tokens.typography.title.lineHeight,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                marginTop: tokens.spacing.xs,
                color: tokens.colors.text.secondary,
                fontFamily: tokens.typography.bodySmall.fontFamily,
                fontSize: tokens.typography.bodySmall.fontSize,
                fontWeight: tokens.typography.bodySmall.fontWeight,
                lineHeight: tokens.typography.bodySmall.lineHeight,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  copy: {
    gap: 2,
  },
});
