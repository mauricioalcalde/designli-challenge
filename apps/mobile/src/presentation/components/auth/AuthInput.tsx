import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';

type IconName = 'mail-outline' | 'lock-closed-outline' | 'person-outline';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: IconName;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
  testID: string;
}

export function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  helperText,
  disabled,
  keyboardType,
  autoCapitalize,
  testID,
}: AuthInputProps) {
  const { tokens } = useTheme();
  const [focused, setFocused] = useState(false);
  const message = error ?? helperText;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {
            color: tokens.colors.text.secondary,
            fontSize: tokens.typography.label.fontSize,
            lineHeight: tokens.typography.label.lineHeight,
            fontWeight: tokens.typography.label.fontWeight,
            fontFamily: tokens.typography.label.fontFamily,
          },
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.field,
          {
            backgroundColor: tokens.colors.bg.surface,
            borderColor: error
              ? tokens.colors.error
              : focused
                ? tokens.colors.primary
                : tokens.colors.border.subtle,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={tokens.colors.text.muted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.text.muted}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            {
              color: tokens.colors.text.primary,
              fontSize: tokens.typography.body.fontSize,
              lineHeight: tokens.typography.body.lineHeight,
              fontFamily: tokens.typography.body.fontFamily,
            },
            disabled && styles.disabled,
          ]}
          testID={`${testID}-text-field`}
        />
      </View>

      {message ? (
        <Text
          style={[
            styles.message,
            {
              color: error ? tokens.colors.error : tokens.colors.textMuted,
              fontSize: tokens.typography.caption.fontSize,
              lineHeight: tokens.typography.caption.lineHeight,
              fontWeight: tokens.typography.caption.fontWeight,
              fontFamily: tokens.typography.caption.fontFamily,
            },
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {},
  field: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 56,
  },
  message: {
    marginTop: -2,
  },
  disabled: {
    opacity: 0.6,
  },
});
