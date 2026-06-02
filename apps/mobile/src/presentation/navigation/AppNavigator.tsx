import { useEffect, useRef, useState } from 'react';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../data/container';
import { useNotificationsStore } from '../../data/container';
import { SplashScreen } from '../screens/SplashScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

type RootStackParamList = {
  Main: undefined;
  StockChart: { symbol: string };
};

/**
 * Root navigator.
 * Conditionally renders AuthStack or MainTabs based on `isAuthenticated`.
 * When auth state changes the tree re-mounts — no flash, clean boundary.
 * Wrapped in ThemeProvider for design-token access from all screens.
 */
export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const maybePromptAfterLogin = useNotificationsStore((s) => s.maybePromptAfterLogin);
  const [hasResolvedLaunch, setHasResolvedLaunch] = useState(false);
  const previousAuthState = useRef(isAuthenticated);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    if (previousAuthState.current === isAuthenticated) {
      return;
    }

    previousAuthState.current = isAuthenticated;
    setHasResolvedLaunch(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void maybePromptAfterLogin();
  }, [isAuthenticated, maybePromptAfterLogin]);

  // Handle notification taps - navigate to stock chart if symbol is in data
  useEffect(() => {
    // Handle notification response (user tapped notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const symbol = data?.symbol as string | undefined;
      
      if (symbol && navigationRef.current?.isReady()) {
        // Navigate to stock chart for the alert symbol
        navigationRef.current.navigate('StockChart', { symbol });
      }
    });

    // Check for initial notification if app was opened from quit state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response || !isAuthenticated) return;
      
      const data = response.notification.request.content.data;
      const symbol = data?.symbol as string | undefined;
      
      if (symbol && navigationRef.current?.isReady()) {
        navigationRef.current.navigate('StockChart', { symbol });
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, [isAuthenticated]);

  return (
    <ThemeProvider>
      {isAuthenticated && !hasResolvedLaunch ? (
        <SplashScreen onFinish={() => setHasResolvedLaunch(true)} />
      ) : (
        <NavigationContainer ref={navigationRef}>
          {isAuthenticated ? (
            <MainTabs />
          ) : (
            <AuthStack
              includeSplash={!hasResolvedLaunch}
              onSplashComplete={() => setHasResolvedLaunch(true)}
            />
          )}
        </NavigationContainer>
      )}
    </ThemeProvider>
  );
}
