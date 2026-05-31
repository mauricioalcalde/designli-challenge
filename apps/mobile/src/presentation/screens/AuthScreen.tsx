import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useAuthStore } from '../../data/container';
import { ConnectivityBanner } from '../components/ConnectivityBanner';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useTheme } from '../theme/useTheme';

type AuthMode = 'login' | 'register';

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Unified auth screen with login + register modes.
 *
 * Layout:
 *   - Top 40%: solid primary background with branded title
 *   - Bottom 60%: theme background
 *   - Elevated card overlapping the boundary, centered over the form
 *
 * Visual states per mode:
 *   login    → email + password + "Sign In" button + create-account link
 *   register → email + password + confirm password + "Create Account" button + sign-in link
 *
 * When `isAuthenticated` becomes true, React Navigation transitions
 * to MainTabs reactively — no explicit navigation call needed.
 */
export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const { tokens } = useTheme();

  const isLogin = mode === 'login';

  function toggleMode(next: AuthMode) {
    void impactAsync(ImpactFeedbackStyle.Light);
    setMode(next);
    setFieldErrors({});
  }

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!email.includes('@')) {
      errors.email = 'Enter a valid email';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!confirmPassword) {
        errors.confirmPassword = 'Confirm your password';
      } else if (confirmPassword !== password) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (isLogin) {
      login(email.trim(), password);
    } else {
      register(email.trim(), password);
    }
  }

  // White-equivalent text that remains visible on the primary header in BOTH themes.
  // In light mode, primary is #2563EB (dark blue) → white text works.
  // In dark mode, primary is #3B82F6 (lighter blue) → white text works.
  const headerTextColor = '#FFFFFF';

  return (
    <View style={styles.root} testID="auth-screen">
      {/* ── Top header area (40%) with solid primary background ── */}
      <View style={[styles.headerArea, { backgroundColor: tokens.colors.primary }]}>
        <ConnectivityBanner />
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.title,
              {
                color: headerTextColor,
                fontSize: tokens.typography.h1.fontSize,
                fontWeight: tokens.typography.h1.fontWeight,
              },
            ]}
          >
            Designli Challenge
          </Text>
          <Text
            style={[
              styles.tagline,
              {
                color: headerTextColor,
                fontSize: tokens.typography.body.fontSize,
              },
            ]}
          >
            Trade smarter, stay ahead.
          </Text>
        </View>
      </View>

      {/* ── Bottom background area (60%) ── */}
      <View style={[styles.bottomArea, { backgroundColor: tokens.colors.background }]} />

      {/* ── Elevated card overlapping the boundary ── */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: tokens.colors.surface,
            borderRadius: tokens.radii.lg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          },
        ]}
      >
        {/* ── Mode toggle (segmented-style tabs) ── */}
        <View style={[styles.toggleRow, { borderColor: tokens.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.toggleTab,
              {
                backgroundColor: isLogin ? tokens.colors.primary : 'transparent',
                borderRadius: tokens.radii.md,
              },
            ]}
            onPress={() => toggleMode('login')}
            activeOpacity={0.7}
            testID="toggle-login"
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: isLogin ? '#FFFFFF' : tokens.colors.textSecondary,
                  fontWeight: isLogin ? '600' : '400',
                  fontSize: tokens.typography.body.fontSize,
                },
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleTab,
              {
                backgroundColor: !isLogin ? tokens.colors.primary : 'transparent',
                borderRadius: tokens.radii.md,
              },
            ]}
            onPress={() => toggleMode('register')}
            activeOpacity={0.7}
            testID="toggle-register"
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: !isLogin ? '#FFFFFF' : tokens.colors.textSecondary,
                  fontWeight: !isLogin ? '600' : '400',
                  fontSize: tokens.typography.body.fontSize,
                },
              ]}
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Email field ── */}
        <Input
          label="Email"
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          error={fieldErrors.email}
          disabled={isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="email-input"
        />

        {/* ── Password field ── */}
        <Input
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          error={fieldErrors.password}
          disabled={isLoading}
          secureTextEntry
          testID="password-input"
        />

        {/* ── Confirm Password (register only) ── */}
        {!isLogin && (
          <Input
            label="Confirm Password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            error={fieldErrors.confirmPassword}
            disabled={isLoading}
            secureTextEntry
            testID="confirm-password-input"
          />
        )}

        {/* ── Server / network error ── */}
        {error ? (
          <Text
            style={[
              styles.errorText,
              {
                color: tokens.colors.error,
                fontSize: tokens.typography.caption.fontSize,
              },
            ]}
          >
            {error}
          </Text>
        ) : null}

        {/* ── Submit button ── */}
        <View style={styles.buttonWrapper}>
          <Button
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            testID="auth-submit-button"
          />
        </View>

        {/* ── Mode toggle link ── */}
        <TouchableOpacity
          onPress={() => toggleMode(isLogin ? 'register' : 'login')}
          activeOpacity={0.6}
          testID="mode-toggle-link"
        >
          <Text
            style={[
              styles.toggleLink,
              {
                color: tokens.colors.primary,
                fontSize: tokens.typography.caption.fontSize,
              },
            ]}
          >
            {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerArea: {
    height: '40%',
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    textAlign: 'center',
    opacity: 0.85,
  },
  bottomArea: {
    height: '60%',
  },
  card: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 3,
    marginBottom: 4,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 2,
  },
  buttonWrapper: {
    marginTop: 2,
  },
  toggleLink: {
    textAlign: 'center',
    marginTop: 4,
  },
});
