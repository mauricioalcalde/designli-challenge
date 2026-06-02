import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTheme } from '../theme/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const { tokens } = useTheme();
  const isInteractive = !disabled && !loading;

  const handlePress = useCallback(() => {
    if (!isInteractive) return;
    void impactAsync(ImpactFeedbackStyle.Light);
    onPress();
  }, [isInteractive, onPress]);

  const containerStyle: ViewStyle[] = [baseStyles.container];

  // Variant styles
  switch (variant) {
    case 'primary':
      containerStyle.push({
        backgroundColor: tokens.colors.primary,
        ...tokens.elevation.low,
      });
      break;
    case 'secondary':
      containerStyle.push({
        backgroundColor: tokens.colors.surface,
        borderWidth: 1,
        borderColor: tokens.colors.border.subtle,
      });
      break;
    case 'outline':
      containerStyle.push({
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: tokens.colors.border.accent,
      });
      break;
  }

  // Disabled / loading opacity
  if (!isInteractive) {
    containerStyle.push({ opacity: 0.5 });
  }

  const textColor =
    variant === 'primary'
      ? '#FFFFFF'
      : variant === 'outline'
        ? tokens.colors.primary
        : tokens.colors.text.primary;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={!isInteractive}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : tokens.colors.primary}
          style={baseStyles.spinner}
        />
      )}
      <Text
        style={[
          baseStyles.text,
          {
            color: textColor,
            fontSize: tokens.typography.button.fontSize,
            lineHeight: tokens.typography.button.lineHeight,
            fontFamily: tokens.typography.button.fontFamily,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  text: {
    fontWeight: '600',
  },
  spinner: {
    marginRight: 4,
  },
});
