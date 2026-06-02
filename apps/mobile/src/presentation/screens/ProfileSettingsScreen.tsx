import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tokenStorage, useAuthStore, useNotificationsStore } from '../../data/container';
import { ScreenContainer } from '../components';
import { LogoutConfirmModal } from '../components/profile/LogoutConfirmModal';
import { SettingsRow } from '../components/profile/SettingsRow';
import { UserProfileCard } from '../components/profile/UserProfileCard';
import type { ProfileStackParamList } from '../navigation/ProfileStack';
import { useTheme } from '../theme/useTheme';
import { version as appVersion } from '../../../package.json';

export function decodeJwtEmail(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    const json = JSON.parse(decoded) as Record<string, unknown>;
    return typeof json.email === 'string' ? json.email : null;
  } catch {
    return null;
  }
}

function getInitials(email: string | null): string {
  if (!email) return '??';
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  const initials = parts
    .map((p) => p[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return initials || '??';
}

export function ProfileSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const logout = useAuthStore((state) => state.logout);
  const permissionStatus = useNotificationsStore((state) => state.permissionStatus);
  const tokenStatus = useNotificationsStore((state) => state.tokenStatus);
  const { tokens } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const email = useMemo(() => {
    const token = tokenStorage.get();
    return token ? decodeJwtEmail(token) : null;
  }, []);

  const initials = getInitials(email);
  const notificationLabel =
    tokenStatus === 'registered'
      ? 'Enabled'
      : tokenStatus === 'error'
        ? 'Failed'
        : permissionStatus === 'granted'
          ? 'Ready to register'
          : 'Disabled';
  const notificationVariant =
    tokenStatus === 'registered'
      ? 'success'
      : tokenStatus === 'error'
        ? 'error'
        : permissionStatus === 'granted'
          ? 'info'
          : 'warning';
  const notificationSubtitle =
    tokenStatus === 'registered'
      ? 'Alert delivery is enabled'
      : tokenStatus === 'error'
        ? 'Registration failed'
        : 'Alert delivery is disabled';

  return (
    <ScreenContainer testID="profile-settings-screen">
      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: tokens.colors.text.secondary }]}>
            Manage your account and alert delivery.
          </Text>
        </View>

        <UserProfileCard initials={initials} email={email ?? 'Signed-in user'} />

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: tokens.colors.text.muted }]}>SETTINGS</Text>
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border.subtle },
            ]}
          >
            <SettingsRow
              icon="notifications-outline"
              title="Notifications"
              subtitle={notificationSubtitle}
              badgeText={notificationLabel}
              badgeVariant={notificationVariant}
              onPress={() => navigation.navigate('NotificationsSettings')}
              testID="profile-settings-notifications-button"
            />
            <SettingsRow
              icon="information-circle-outline"
              title="App version"
              value={`v${appVersion}`}
            />
          </View>
        </View>

        <View
          style={[
            styles.logoutCard,
            { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.error },
          ]}
        >
          <SettingsRow
            icon="log-out-outline"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={() => setShowLogoutModal(true)}
            testID="profile-settings-logout-button"
          />
        </View>
      </View>

      <LogoutConfirmModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },
  headerBlock: {
    gap: 8,
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
  sectionBlock: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  settingsCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  logoutCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
