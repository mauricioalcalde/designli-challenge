import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import type { ColorTokens } from '../theme/types';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  testID?: string;
}

function variantColor(variant: BadgeVariant, colors: ColorTokens): string {
  switch (variant) {
    case 'success':
      return colors.success;
    case 'error':
      return colors.error;
    case 'warning':
      return colors.warning;
    case 'info':
      return colors.info;
  }
}

export function Badge({ text, variant = 'info', testID }: BadgeProps) {
  const { tokens } = useTheme();
  const color = variantColor(variant, tokens.colors);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${color}20`,
          borderRadius: tokens.radii.full,
        },
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: '600',
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {},
});
