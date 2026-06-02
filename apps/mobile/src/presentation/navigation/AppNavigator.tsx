import { useEffect, useRef, useState } from 'react';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../data/container';
import { useNotificationsStore } from '../../data/container';
import { useInboxStore } from '../../data/container';
import { SplashScreen } from '../screens/SplashScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { mapPushToInboxInput } from '../utils/push-mapping';

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
    // Shared handler for both foreground-tap and cold-start notification
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      const symbol = data?.symbol as string | undefined;

      // Persist to inbox via pure mapping function
      useInboxStore.getState().addNotification(
        mapPushToInboxInput({
          title: response.notification.request.content.title,
          body: response.notification.request.content.body,
          data,
        }),
      );

      if (symbol && navigationRef.current?.isReady()) {
        // Navigate to stock chart for the alert symbol
        navigationRef.current.navigate('StockChart', { symbol });
      }
    };

    // Handle notification response (user tapped notification)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    // Check for initial notification if app was opened from quit state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response || !isAuthenticated) return;
      handleResponse(response);
    });

    return () => {
      responseSubscription.remove();
    };
  }, [isAuthenticated]);

  // Handle foreground push notifications — persist to inbox
  useEffect(() => {
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      useInboxStore.getState().addNotification(
        mapPushToInboxInput({
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data as Record<string, unknown> | undefined,
        }),
      );
    });

    return () => {
      foregroundSubscription.remove();
    };
  }, []);

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
