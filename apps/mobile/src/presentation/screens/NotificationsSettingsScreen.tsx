import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotificationsStore } from '../../data/container';

export function NotificationsSettingsScreen() {
  const permissionStatus = useNotificationsStore((state) => state.permissionStatus);
  const tokenStatus = useNotificationsStore((state) => state.tokenStatus);
  const isChecking = useNotificationsStore((state) => state.isChecking);
  const isRegistering = useNotificationsStore((state) => state.isRegistering);
  const error = useNotificationsStore((state) => state.error);
  const lastRegisteredAt = useNotificationsStore((state) => state.lastRegisteredAt);
  const refreshStatus = useNotificationsStore((state) => state.refreshStatus);
  const requestPermissionAndRegister = useNotificationsStore((state) => state.requestPermissionAndRegister);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const isRegistered = tokenStatus === 'registered';
  const isUnsupported = permissionStatus === 'unsupported';
  const isDenied = permissionStatus === 'denied';
  const isLoading = isChecking || (permissionStatus === 'unknown' && tokenStatus === 'idle');

  return (
    <View style={styles.container} testID="notifications-screen">
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Prepare this device for stock alert delivery.</Text>

      {isLoading ? (
        <View style={styles.card} testID="notifications-loading-state">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.body}>Checking notification readiness...</Text>
        </View>
      ) : null}

      {!isLoading && isUnsupported ? (
        <View style={styles.card} testID="notifications-unsupported-state">
          <Text style={styles.heading}>Notifications unavailable</Text>
          <Text style={styles.body}>
            Use a native iOS or Android development build on a supported device to continue.
          </Text>
        </View>
      ) : null}

      {!isLoading && !isUnsupported && isDenied ? (
        <View style={styles.card} testID="notifications-denied-state">
          <Text style={styles.heading}>Notifications are disabled</Text>
          <Text style={styles.body}>Enable permission, then register this device.</Text>
        </View>
      ) : null}

      {!isLoading && !isUnsupported && permissionStatus === 'granted' && !isRegistered && !error ? (
        <View style={styles.card} testID="notifications-ready-state">
          <Text style={styles.heading}>Ready to register</Text>
          <Text style={styles.body}>Permission is granted. Register this device when you are ready.</Text>
        </View>
      ) : null}

      {!isLoading && tokenStatus === 'error' && error ? (
        <View style={styles.card} testID="notifications-error-state">
          <Text style={styles.heading}>Registration failed</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!isLoading && isRegistered ? (
        <View style={styles.card} testID="notifications-registered-state">
          <Text style={styles.heading}>Device registered</Text>
          <Text style={styles.body}>
            {lastRegisteredAt
              ? `Last registered at ${lastRegisteredAt}`
              : 'This device is ready to receive future push work.'}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        disabled={isLoading || isRegistering}
        onPress={() => void requestPermissionAndRegister()}
        style={[styles.primaryButton, (isLoading || isRegistering) && styles.primaryButtonDisabled]}
        testID="notifications-primary-action"
      >
        {isRegistering ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Enable and register</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
  },
  card: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  errorText: {
    fontSize: 15,
    color: '#B91C1C',
  },
  primaryButton: {
    marginTop: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
