import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useAuthStore } from '../../data/container';
import { AuthFooterLink } from '../components/auth/AuthFooterLink';
import { AuthHeader } from '../components/auth/AuthHeader';
import { AuthInput } from '../components/auth/AuthInput';
import { PasswordInput } from '../components/auth/PasswordInput';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import type { AuthStackParamList } from '../navigation/AuthStack';

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate() {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!email.includes('@')) next.email = 'Enter a valid email';

    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    await login(email.trim(), password);
  }

  function goToRegister() {
    void impactAsync(ImpactFeedbackStyle.Light);
    navigation.navigate('Register');
  }

  return (
    <AuthScreenShell
      header={
        <AuthHeader
          title="Welcome back"
          subtitle="Sign in to continue tracking your market and managing alerts."
        />
      }
      primaryLabel="Sign in"
      onPrimaryPress={handleSubmit}
      isLoading={isLoading}
      error={error}
      footer={
        <AuthFooterLink
          prefix="Don’t have an account?"
          actionLabel="Create account"
          onPress={goToRegister}
          testID="auth-footer-link"
        />
      }
      testID="login-screen"
    >
      <AuthInput
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
        }}
        icon="mail-outline"
        error={fieldErrors.email}
        disabled={isLoading}
        keyboardType="email-address"
        autoCapitalize="none"
        testID="email-input"
      />

      <PasswordInput
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={fieldErrors.password}
        disabled={isLoading}
        testID="password-input"
      />
    </AuthScreenShell>
  );
}
