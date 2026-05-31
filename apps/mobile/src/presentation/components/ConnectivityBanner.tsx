import { Text, StyleSheet } from 'react-native';
import { useConnectivity } from '../hooks/useConnectivity';

/**
 * Non-dismissible "No internet connection" banner.
 * Renders only when the device is offline — auto-hides on reconnect.
 * Displayed on the auth screen (LoginScreen includes it).
 */
export function ConnectivityBanner() {
  const isConnected = useConnectivity();

  if (isConnected) {
    return null;
  }

  return <Text style={styles.banner}>No internet connection</Text>;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF4444',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});
