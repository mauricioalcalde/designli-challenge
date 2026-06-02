import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '../Badge';
import { useTheme } from '../../theme/useTheme';

interface UserProfileCardProps {
  initials: string;
  email: string;
}

export function UserProfileCard({ initials, email }: UserProfileCardProps) {
  const { tokens } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border.subtle,
        },
      ]}
      testID="profile-settings-user-card"
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: tokens.colors.primary,
          },
        ]}
        testID="profile-settings-avatar"
      >
        <Text style={[styles.avatarText, { color: tokens.colors.textInverse }]}>{initials}</Text>
      </View>

      <View style={styles.copy}>
        <Text style={[styles.kicker, { color: tokens.colors.text.muted }]}>Signed-in account</Text>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.email, { color: tokens.colors.text.primary }]}
          testID="profile-settings-email"
        >
          {email}
        </Text>
        <Badge text="Signed in" variant="success" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  email: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
});
