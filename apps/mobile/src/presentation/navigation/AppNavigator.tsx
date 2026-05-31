import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../data/container';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

/**
 * Root navigator.
 * Conditionally renders AuthStack or MainTabs based on `isAuthenticated`.
 * When auth state changes the tree re-mounts — no flash, clean boundary.
 * Wrapped in ThemeProvider for design-token access from all screens.
 */
export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <ThemeProvider>
      <NavigationContainer>{isAuthenticated ? <MainTabs /> : <AuthStack />}</NavigationContainer>
    </ThemeProvider>
  );
}
