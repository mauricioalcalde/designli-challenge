import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

export type ChipVariant = 'default' | 'active' | 'success' | 'warning' | 'error';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  onPress?: () => void;
  testID?: string;
}

function getVariantColors(variant: ChipVariant, tokens: ReturnType<typeof useTheme>['tokens']) {
  switch (variant) {
    case 'active':
      return {
        backgroundColor: tokens.colors.primary,
        borderColor: tokens.colors.primary,
        textColor: '#FFFFFF',
      };
    case 'success':
      return {
        backgroundColor: `${tokens.colors.success}22`,
        borderColor: `${tokens.colors.success}44`,
        textColor: tokens.colors.success,
      };
    case 'warning':
      return {
        backgroundColor: `${tokens.colors.warning}22`,
        borderColor: `${tokens.colors.warning}44`,
        textColor: tokens.colors.warning,
      };
    case 'error':
      return {
        backgroundColor: `${tokens.colors.error}22`,
        borderColor: `${tokens.colors.error}44`,
        textColor: tokens.colors.error,
      };
    case 'default':
    default:
      return {
        backgroundColor: tokens.colors.bg.surface,
        borderColor: tokens.colors.border.subtle,
        textColor: tokens.colors.text.secondary,
      };
  }
}

export function Chip({ label, variant = 'default', onPress, testID }: ChipProps) {
  const { tokens } = useTheme();
  const colors = getVariantColors(variant, tokens);

  const content = (
    <>
      <Text
        style={[
          styles.text,
          {
            color: colors.textColor,
            fontFamily: tokens.typography.caption.fontFamily,
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: '700',
            lineHeight: tokens.typography.caption.lineHeight,
          },
        ]}
      >
        {label}
      </Text>
    </>
  );

  const sharedStyle = [
    styles.base,
    {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      borderRadius: tokens.radius.chip,
    },
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={sharedStyle} testID={testID}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={sharedStyle} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {},
});
