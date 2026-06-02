import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotificationsStore } from '../../data/container';
import { Button, ScreenContainer, Skeleton } from '../components';
import { NotificationInfoCard } from '../components/notifications/NotificationInfoCard';
import { NotificationStatusDetailsCard } from '../components/notifications/NotificationStatusDetailsCard';
import { NotificationStatusHero } from '../components/notifications/NotificationStatusHero';
import { useTheme } from '../theme/useTheme';

function formatPermissionStatus(status: string): string {
  switch (status) {
    case 'granted':
      return 'Granted';
    case 'denied':
      return 'Denied';
    case 'unsupported':
      return 'Unsupported';
    default:
      return 'Unknown';
  }
}

export function NotificationsSettingsScreen() {
  const navigation = useNavigation<any>();
  const permissionStatus = useNotificationsStore((state) => state.permissionStatus);
  const tokenStatus = useNotificationsStore((state) => state.tokenStatus);
  const isSupported = useNotificationsStore((state) => state.isSupported);
  const isChecking = useNotificationsStore((state) => state.isChecking);
  const isRegistering = useNotificationsStore((state) => state.isRegistering);
  const error = useNotificationsStore((state) => state.error);
  const lastRegisteredAt = useNotificationsStore((state) => state.lastRegisteredAt);
  const platform = useNotificationsStore((state) => state.platform);
  const tokenPreview = useNotificationsStore((state) => state.tokenPreview);
  const refreshStatus = useNotificationsStore((state) => state.refreshStatus);
  const requestPermissionAndRegister = useNotificationsStore(
    (state) => state.requestPermissionAndRegister,
  );
  const openSystemSettings = useNotificationsStore((state) => state.openSystemSettings);
  const { tokens } = useTheme();

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const hero = useMemo(() => {
    if (!isSupported || permissionStatus === 'unsupported') {
      return {
        title: 'Notifications are not supported',
        message: 'Use a native iOS or Android build to manage push delivery.',
        tone: 'warning' as const,
      };
    }
    if (tokenStatus === 'registered') {
      return {
        title: 'Notifications are enabled',
        message: 'This device is ready to receive stock alert notifications.',
        tone: 'success' as const,
      };
    }
    if (tokenStatus === 'error') {
      return {
        title: 'Registration failed',
        message: 'We couldn’t register this device. Please try again.',
        tone: 'error' as const,
      };
    }
    if (permissionStatus === 'granted') {
      return {
        title: 'Device registration required',
        message: 'Permission is granted, but this device is not registered yet.',
        tone: 'info' as const,
      };
    }
    return {
      title: 'Notifications are disabled',
      message: 'Enable notifications to receive real-time alert delivery.',
      tone: 'warning' as const,
    };
  }, [isSupported, permissionStatus, tokenStatus]);

  const cta = useMemo(() => {
    if (!isSupported || permissionStatus === 'unsupported') {
      return {
        label: 'Notifications unsupported',
        disabled: true,
        action: undefined as (() => Promise<void>) | undefined,
      };
    }
    if (tokenStatus === 'registered') {
      return {
        label: 'Notifications enabled',
        disabled: true,
        action: undefined as (() => Promise<void>) | undefined,
      };
    }
    if (permissionStatus === 'denied') {
      return { label: 'Open system settings', disabled: false, action: openSystemSettings };
    }
    if (tokenStatus === 'error') {
      return { label: 'Retry registration', disabled: false, action: requestPermissionAndRegister };
    }
    if (permissionStatus === 'granted') {
      return { label: 'Register device', disabled: false, action: requestPermissionAndRegister };
    }
    return { label: 'Enable notifications', disabled: false, action: requestPermissionAndRegister };
  }, [
    isSupported,
    permissionStatus,
    tokenStatus,
    openSystemSettings,
    requestPermissionAndRegister,
  ]);

  return (
    <ScreenContainer testID="notifications-screen">
      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            testID="notifications-back-button"
          >
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.topCopy}>
            <Text style={[styles.title, { color: tokens.colors.text.primary }]}>Notifications</Text>
            <Text style={[styles.subtitle, { color: tokens.colors.text.secondary }]}>
              Get notified when your alerts are triggered.
            </Text>
          </View>
        </View>

        {isChecking ? (
          <View style={styles.loadingBlock}>
            <Skeleton.Card height={180} testID="notifications-loading-hero" />
            <Skeleton.Card height={220} testID="notifications-loading-details" />
          </View>
        ) : (
          <>
            <NotificationStatusHero title={hero.title} message={hero.message} tone={hero.tone} />
            <NotificationStatusDetailsCard
              permissionStatus={formatPermissionStatus(permissionStatus)}
              registrationStatus={
                tokenStatus === 'registered'
                  ? 'Registered'
                  : tokenStatus === 'error'
                    ? 'Failed'
                    : 'Not registered'
              }
              lastRegistered={lastRegisteredAt ?? 'Never'}
              platform={platform ?? 'Unknown'}
              tokenPreview={tokenPreview}
            />
            <NotificationInfoCard message="Enable notifications after signing in. This device needs a registered token so triggered alerts can be delivered in real time." />
            {error ? (
              <Text style={[styles.error, { color: tokens.colors.error }]}>{error}</Text>
            ) : null}
            <Button
              title={cta.label}
              onPress={() => void cta.action?.()}
              loading={isRegistering}
              disabled={cta.disabled || isRegistering}
              testID="notifications-primary-action"
            />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  topCopy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingBlock: {
    gap: 16,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
});
