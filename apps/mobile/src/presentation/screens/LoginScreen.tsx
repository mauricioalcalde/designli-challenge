import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../data/container';
import { ConnectivityBanner } from '../components/ConnectivityBanner';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useTheme } from '../theme/useTheme';

interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * Login form with branded gradient header + themed Input/Button components.
 *
 * Visual states:
 *   pristine → enabled submit button
 *   loading  → disabled button + loading spinner
 *   error    → error text below the form
 *
 * When `isAuthenticated` becomes true, React Navigation handles
 * the transition to MainTabs reactively — no explicit navigation call.
 */
export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const { tokens } = useTheme();

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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = () => {
    if (!validate()) return;
    login(email.trim(), password);
  };

  return (
    <LinearGradient
      colors={[tokens.colors.primary, tokens.colors.background]}
      style={styles.container}
      testID="login-screen"
    >
      <ConnectivityBanner />
      <View style={styles.form}>
        {/* Branded header */}
        <Text
          style={[
            styles.title,
            {
              color: '#FFFFFF',
              fontSize: tokens.typography.h1.fontSize,
              fontWeight: tokens.typography.h1.fontWeight,
            },
          ]}
        >
          Designli Challenge
        </Text>

        {/* Email field */}
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

        {/* Password field */}
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

        {/* Server-side / network error */}
        {error ? (
          <Text
            style={[
              styles.error,
              {
                color: tokens.colors.error,
                fontSize: tokens.typography.body.fontSize,
              },
            ]}
          >
            {error}
          </Text>
        ) : null}

        {/* Submit button — themed with loading state */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Sign In"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            testID="login-button"
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonWrapper: {
    marginTop: 8,
  },
});
