import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTheme } from '../theme/useTheme';

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
}

export function Card({ title, subtitle, children, onPress, testID }: CardProps) {
  const { tokens } = useTheme();

  const cardStyle: ViewStyle = {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.colors.bg.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    ...tokens.elevation.low,
  };

  const content = (
    <>
      {title && (
        <Text
          style={[
            styles.title,
            {
              color: tokens.colors.text.primary,
              fontSize: tokens.typography.title.fontSize,
              fontWeight: tokens.typography.title.fontWeight,
              lineHeight: tokens.typography.title.lineHeight,
              fontFamily: tokens.typography.title.fontFamily,
            },
          ]}
        >
          {title}
        </Text>
      )}
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color: tokens.colors.text.secondary,
              fontSize: tokens.typography.body.fontSize,
              lineHeight: tokens.typography.body.lineHeight,
              fontFamily: tokens.typography.body.fontFamily,
              marginTop: title ? 4 : 0,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={() => {
          void impactAsync(ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.7}
        testID={testID}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {},
  subtitle: {},
});
