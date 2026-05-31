import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  title: string;
  message: string;
  action?: EmptyStateAction;
  testID?: string;
}

export function EmptyState({ title, message, action, testID }: EmptyStateProps) {
  const { tokens } = useTheme();

  return (
    <View style={[styles.container, { padding: tokens.spacing.xl }]} testID={testID}>
      <Text
        style={[
          styles.title,
          {
            color: tokens.colors.text,
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          {
            color: tokens.colors.textSecondary,
            fontSize: tokens.typography.body.fontSize,
          },
        ]}
      >
        {message}
      </Text>
      {action && (
        <View style={styles.actionWrapper}>
          <Button
            title={action.label}
            onPress={action.onPress}
            variant="primary"
            testID={testID ? `${testID}-action-button` : 'empty-state-action'}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionWrapper: {
    minWidth: 160,
  },
});
