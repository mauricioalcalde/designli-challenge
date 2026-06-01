import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../ScreenContainer';
import { ConnectivityBanner } from '../ConnectivityBanner';
import { useTheme } from '../../theme/useTheme';

interface AuthScreenShellProps extends PropsWithChildren {
  header: ReactNode;
  error?: string | null;
  primaryLabel: string;
  onPrimaryPress: () => void;
  isLoading?: boolean;
  footer: ReactNode;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  testID: string;
}

export function AuthScreenShell({
  header,
  error,
  primaryLabel,
  onPrimaryPress,
  isLoading,
  footer,
  secondaryActionLabel,
  onSecondaryActionPress,
  children,
  testID,
}: AuthScreenShellProps) {
  const { tokens } = useTheme();

  return (
    <ScreenContainer style={{ backgroundColor: tokens.colors.background }} testID={testID}>
      <ConnectivityBanner />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        testID={`${testID}-keyboard-avoiding`}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {header}

          <View style={styles.formBlock}>{children}</View>

          {secondaryActionLabel && onSecondaryActionPress ? (
            <TouchableOpacity
              onPress={onSecondaryActionPress}
              activeOpacity={0.7}
              style={styles.secondaryAction}
              testID={`${testID}-secondary-action`}
            >
              <Text
                style={{
                  color: tokens.colors.primary,
                  fontSize: tokens.typography.caption.fontSize,
                  lineHeight: tokens.typography.caption.lineHeight,
                  fontWeight: tokens.typography.caption.fontWeight,
                  fontFamily: tokens.typography.caption.fontFamily,
                }}
              >
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          ) : null}

          {error ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: 'rgba(239,95,103,0.12)',
                  borderColor: tokens.colors.error,
                },
              ]}
            >
              <Text
                style={{
                  color: tokens.colors.error,
                  fontSize: tokens.typography.caption.fontSize,
                  lineHeight: tokens.typography.caption.lineHeight,
                  fontWeight: tokens.typography.caption.fontWeight,
                  fontFamily: tokens.typography.caption.fontFamily,
                }}
              >
                {error}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={onPrimaryPress}
            activeOpacity={0.85}
            disabled={Boolean(isLoading)}
            testID="auth-submit-button"
            style={[
              styles.primaryButton,
              {
                backgroundColor: tokens.colors.primary,
                opacity: isLoading ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: tokens.typography.button.fontSize,
                lineHeight: tokens.typography.button.lineHeight,
                fontWeight: tokens.typography.button.fontWeight,
                fontFamily: tokens.typography.button.fontFamily,
              }}
            >
              {primaryLabel}
            </Text>
          </TouchableOpacity>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    justifyContent: 'center',
    gap: 24,
  },
  formBlock: {
    gap: 16,
  },
  secondaryAction: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
