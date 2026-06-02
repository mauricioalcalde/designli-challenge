import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';

interface NotificationStatusHeroProps {
  title: string;
  message: string;
  tone: 'success' | 'warning' | 'error' | 'info';
}

export function NotificationStatusHero({ title, message, tone }: NotificationStatusHeroProps) {
  const { tokens } = useTheme();
  const color =
    tone === 'success'
      ? tokens.colors.success
      : tone === 'warning'
        ? tokens.colors.warning
        : tone === 'error'
          ? tokens.colors.error
          : tokens.colors.info;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border.subtle },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
        <Ionicons name="notifications-outline" size={28} color={color} />
      </View>
      <Text style={[styles.title, { color: tokens.colors.text.primary }]}>{title}</Text>
      <Text style={[styles.message, { color: tokens.colors.text.secondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
