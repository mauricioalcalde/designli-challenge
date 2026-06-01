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
  confirmPassword?: string;
}

const strongPasswordPattern = /^(?=.*[A-Za-z])(?=.*\d|.*[^A-Za-z\d]).{8,}$/;

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate() {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!email.includes('@')) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (!strongPasswordPattern.test(password)) {
      next.password = 'Use 8+ characters with a mix of letters, numbers & symbols.';
    }
    if (!confirmPassword) next.confirmPassword = 'Confirm your password';
    else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    await register(email.trim(), password);
  }

  function goToLogin() {
    void impactAsync(ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  }

  return (
    <AuthScreenShell
      header={
        <AuthHeader
          title="Create your account"
          subtitle="Join Designli to start tracking stocks, getting alerts, and managing your portfolio."
        />
      }
      primaryLabel="Create account"
      onPrimaryPress={handleSubmit}
      isLoading={isLoading}
      error={error}
      footer={
        <AuthFooterLink
          prefix="Already have an account?"
          actionLabel="Sign in"
          onPress={goToLogin}
          testID="auth-footer-link"
        />
      }
      testID="register-screen"
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
        placeholder="Create a strong password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={fieldErrors.password}
        helperText="Use 8+ characters with a mix of letters, numbers & symbols."
        disabled={isLoading}
        testID="password-input"
      />

      <PasswordInput
        label="Confirm password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (fieldErrors.confirmPassword) {
            setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }
        }}
        error={fieldErrors.confirmPassword}
        disabled={isLoading}
        testID="confirm-password-input"
      />
    </AuthScreenShell>
  );
}
