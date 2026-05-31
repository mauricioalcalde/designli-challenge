import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../data/container';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

/**
 * Root navigator.
 * Conditionally renders AuthStack or MainTabs based on `isAuthenticated`.
 * When auth state changes the tree re-mounts — no flash, clean boundary.
 */
export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
