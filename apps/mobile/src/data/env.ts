import { Platform } from 'react-native';

/**
 * Resolves the API host for the current runtime.
 *
 * Development:
 *   - Android emulator uses 10.0.2.2 to reach the host machine
 *   - iOS simulator can use localhost directly
 *   - Physical device: set EXPO_PUBLIC_API_HOST to your machine's LAN IP
 *
 * Production:
 *   - Set EXPO_PUBLIC_API_URL to the full Render URL (e.g., https://designli-api.onrender.com)
 */

// Production URL takes precedence if set
const PRODUCTION_URL = process.env.EXPO_PUBLIC_API_URL;

if (PRODUCTION_URL) {
  export const API_BASE_URL = PRODUCTION_URL;
} else {
  // Development fallback
  const DEV_HOST = Platform.select({
    android: '10.0.2.2',
    ios: 'localhost',
    default: 'localhost',
  });

  const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '3000';
  const API_HOST = process.env.EXPO_PUBLIC_API_HOST ?? DEV_HOST;

  export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
}
