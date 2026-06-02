import { StyleSheet, Text } from 'react-native';
import { useConnectivity } from '../hooks/useConnectivity';
import { useTheme } from '../theme/useTheme';

/**
 * Non-dismissible "No internet connection" banner.
 * Renders only when the device is offline — auto-hides on reconnect.
 * Displayed on the auth screen (AuthScreen includes it).
 */
export function ConnectivityBanner() {
  const isConnected = useConnectivity();
  const { tokens } = useTheme();

  if (isConnected) {
    return null;
  }

  return (
    <Text
      style={[
        styles.banner,
        {
          backgroundColor: tokens.colors.semantic.error,
          color: tokens.colors.text.inverse,
          fontFamily: tokens.typography.bodySmall.fontFamily,
          fontSize: tokens.typography.bodySmall.fontSize,
          lineHeight: tokens.typography.bodySmall.lineHeight,
        },
      ]}
    >
      No internet connection
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    textAlign: 'center',
    paddingVertical: 8,
    fontWeight: '600',
  },
});
