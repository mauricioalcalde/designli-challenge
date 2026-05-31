import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from './src/data/container';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';

// Keep native splash visible until bootstrap completes.
// eslint-disable-next-line @typescript-eslint/no-floating-promises
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
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
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
