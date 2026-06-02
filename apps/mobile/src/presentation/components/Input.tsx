import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface InputProps {
  label: string;
  value?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
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
  helperText,
  disabled = false,
  onChangeText,
  testID,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
}: InputProps) {
  const { tokens } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  const hasError = Boolean(error);
  const statusText = error ?? helperText;
  const statusColor = hasError ? tokens.colors.semantic.error : tokens.colors.text.secondary;
  const borderColor = hasError
    ? tokens.colors.border.danger
    : isFocused
      ? tokens.colors.primary
      : tokens.colors.border.subtle;

  const isSecureField = Boolean(secureTextEntry);
  const effectiveSecureTextEntry = isSecureField && !isSecureVisible;

  return (
    <View>
      <Text
        style={[
          styles.label,
          {
            color: tokens.colors.text.secondary,
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: tokens.typography.caption.fontWeight,
            fontFamily: tokens.typography.caption.fontFamily,
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputShell,
          {
            borderColor,
            backgroundColor: tokens.colors.bg.surface,
            borderRadius: tokens.radius.input,
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: tokens.colors.text.primary,
              fontSize: tokens.typography.body.fontSize,
              lineHeight: tokens.typography.body.lineHeight,
              fontFamily: tokens.typography.body.fontFamily,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.lg,
              paddingRight: isSecureField ? 48 : tokens.spacing.md,
            },
          ]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.text.muted}
          editable={!disabled}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={effectiveSecureTextEntry}
          testID={testID ? `${testID}-text-field` : undefined}
        />
        {isSecureField ? (
          <TouchableOpacity
            onPress={() => setIsSecureVisible((prev) => !prev)}
            style={styles.visibilityToggle}
            testID={testID ? `${testID}-visibility-toggle` : 'input-visibility-toggle'}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={tokens.colors.text.secondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {statusText && (
        <Text
          style={[
            styles.error,
            {
              color: statusColor,
              fontSize: tokens.typography.caption.fontSize,
              lineHeight: tokens.typography.caption.lineHeight,
              fontWeight: tokens.typography.caption.fontWeight,
              fontFamily: tokens.typography.caption.fontFamily,
            },
          ]}
        >
          {statusText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  inputShell: {
    position: 'relative',
    borderWidth: 1,
    justifyContent: 'center',
  },
  input: {
    minHeight: 54,
  },
  visibilityToggle: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    marginTop: 8,
    marginLeft: 4,
  },
});
