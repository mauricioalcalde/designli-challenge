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
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.surface,
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // Shadow (Android)
    elevation: 2,
  };

  const content = (
    <>
      {title && (
        <Text
          style={[
            styles.title,
            {
              color: tokens.colors.text,
              fontSize: tokens.typography.h4.fontSize,
              fontWeight: tokens.typography.h4.fontWeight,
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
              color: tokens.colors.textSecondary,
              fontSize: tokens.typography.body.fontSize,
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
