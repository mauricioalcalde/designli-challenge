import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuthStore } from './src/data/container';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Keep native splash visible until bootstrap completes.
// eslint-disable-next-line @typescript-eslint/no-floating-promises
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      // Create notification channel for Android (required for Android 8+)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Stock Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E6847E',
          sound: 'default',
        });
      }

      // Bootstrap sync — reads MMKV token, sets isAuthenticated.
      // Must run before hideAsync so the correct navigator renders immediately.
      useAuthStore.getState().bootstrap();
      await SplashScreen.hideAsync();
      setIsReady(true);
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    init();
  }, []);

  // Render nothing while the splash is visible.
  // After bootstrap + hideAsync, render the auth-aware navigator.
  if (!isReady) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#111531" />
      <AppNavigator />
    </>
  );
}
