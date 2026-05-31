import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNotificationsStore } from '../../data/container';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { useTheme } from '../theme/useTheme';

export function NotificationsSettingsScreen() {
  const permissionStatus = useNotificationsStore((state) => state.permissionStatus);
  const tokenStatus = useNotificationsStore((state) => state.tokenStatus);
  const isChecking = useNotificationsStore((state) => state.isChecking);
  const isRegistering = useNotificationsStore((state) => state.isRegistering);
  const error = useNotificationsStore((state) => state.error);
  const lastRegisteredAt = useNotificationsStore((state) => state.lastRegisteredAt);
  const refreshStatus = useNotificationsStore((state) => state.refreshStatus);
  const requestPermissionAndRegister = useNotificationsStore(
    (state) => state.requestPermissionAndRegister,
  );

  const { tokens } = useTheme();

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const isRegistered = tokenStatus === 'registered';
  const isUnsupported = permissionStatus === 'unsupported';
  const isDenied = permissionStatus === 'denied';
  const isLoading = isChecking || (permissionStatus === 'unknown' && tokenStatus === 'idle');

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: tokens.colors.background, padding: tokens.spacing.lg },
      ]}
      testID="notifications-screen"
    >
      <Text
        style={[
          styles.title,
          {
            color: tokens.colors.text,
            fontSize: tokens.typography.h2.fontSize,
            fontWeight: tokens.typography.h2.fontWeight,
          },
        ]}
      >
        Notifications
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            color: tokens.colors.textSecondary,
            fontSize: tokens.typography.body.fontSize,
          },
        ]}
      >
        Prepare this device for stock alert delivery.
      </Text>

      {isLoading && (
        <Card testID="notifications-loading-state">
          <Skeleton.Line width={240} height={16} />
          <View style={{ height: 8 }} />
          <Skeleton.Line width={180} height={14} />
        </Card>
      )}

      {!isLoading && isUnsupported && (
        <Card testID="notifications-unsupported-state">
          <Text
            style={[
              styles.heading,
              {
                color: tokens.colors.text,
                fontSize: tokens.typography.h4.fontSize,
                fontWeight: tokens.typography.h4.fontWeight,
              },
            ]}
          >
            Notifications unavailable
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: tokens.colors.textSecondary,
                fontSize: tokens.typography.body.fontSize,
              },
            ]}
          >
            Use a native iOS or Android development build on a supported device to continue.
          </Text>
        </Card>
      )}

      {!isLoading && !isUnsupported && isDenied && (
        <Card testID="notifications-denied-state">
          <Text
            style={[
              styles.heading,
              {
                color: tokens.colors.text,
                fontSize: tokens.typography.h4.fontSize,
                fontWeight: tokens.typography.h4.fontWeight,
              },
            ]}
          >
            Notifications are disabled
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: tokens.colors.textSecondary,
                fontSize: tokens.typography.body.fontSize,
              },
            ]}
          >
            Enable permission, then register this device.
          </Text>
        </Card>
      )}

      {!isLoading &&
        !isUnsupported &&
        permissionStatus === 'granted' &&
        !isRegistered &&
        !error && (
          <Card testID="notifications-ready-state">
            <Text
              style={[
                styles.heading,
                {
                  color: tokens.colors.text,
                  fontSize: tokens.typography.h4.fontSize,
                  fontWeight: tokens.typography.h4.fontWeight,
                },
              ]}
            >
              Ready to register
            </Text>
            <Text
              style={[
                styles.body,
                {
                  color: tokens.colors.textSecondary,
                  fontSize: tokens.typography.body.fontSize,
                },
              ]}
            >
              Permission is granted. Register this device when you are ready.
            </Text>
          </Card>
        )}

      {!isLoading && tokenStatus === 'error' && error && (
        <Card testID="notifications-error-state">
          <Text
            style={[
              styles.heading,
              {
                color: tokens.colors.text,
                fontSize: tokens.typography.h4.fontSize,
                fontWeight: tokens.typography.h4.fontWeight,
              },
            ]}
          >
            Registration failed
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: tokens.colors.error,
                fontSize: tokens.typography.body.fontSize,
              },
            ]}
          >
            {error}
          </Text>
        </Card>
      )}

      {!isLoading && isRegistered && (
        <Card testID="notifications-registered-state">
          <Text
            style={[
              styles.heading,
              {
                color: tokens.colors.text,
                fontSize: tokens.typography.h4.fontSize,
                fontWeight: tokens.typography.h4.fontWeight,
              },
            ]}
          >
            Device registered
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: tokens.colors.textSecondary,
                fontSize: tokens.typography.body.fontSize,
              },
            ]}
          >
            {lastRegisteredAt
              ? `Last registered at ${lastRegisteredAt}`
              : 'This device is ready to receive future push work.'}
          </Text>
        </Card>
      )}

      <View style={styles.buttonWrapper}>
        <Button
          title="Enable and register"
          onPress={() => void requestPermissionAndRegister()}
          loading={isRegistering}
          disabled={isLoading || isRegistering}
          testID="notifications-primary-action"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  title: {},
  subtitle: {},
  heading: {
    marginBottom: 4,
  },
  body: {
    lineHeight: 22,
  },
  buttonWrapper: {
    marginTop: 'auto',
  },
});
