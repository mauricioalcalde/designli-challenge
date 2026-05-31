import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface InputProps {
  label: string;
  value?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onChangeText?: (text: string) => void;
  testID?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
}

export function Input({
  label,
  value,
  placeholder,
  error,
  disabled = false,
  onChangeText,
  testID,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
}: InputProps) {
  const { tokens } = useTheme();

  const hasError = Boolean(error);

  return (
    <View>
      <Text
        style={[
          styles.label,
          {
            color: tokens.colors.text,
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: hasError ? tokens.colors.error : tokens.colors.border,
            backgroundColor: tokens.colors.background,
            color: tokens.colors.text,
            fontSize: tokens.typography.body.fontSize,
            borderRadius: tokens.radii.md,
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: 12,
          },
          disabled && { opacity: 0.5 },
        ]}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.textSecondary}
        editable={!disabled}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        testID={testID ? `${testID}-text-field` : undefined}
      />
      {hasError && (
        <Text
          style={[
            styles.error,
            {
              color: tokens.colors.error,
              fontSize: tokens.typography.caption.fontSize,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
  },
  error: {
    marginTop: 4,
    marginLeft: 4,
  },
});
