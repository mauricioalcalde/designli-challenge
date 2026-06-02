import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';

interface NotificationInfoCardProps {
  message: string;
}

export function NotificationInfoCard({ message }: NotificationInfoCardProps) {
  const { tokens } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border.subtle },
      ]}
    >
      <Ionicons name="information-circle-outline" size={20} color={tokens.colors.info} />
      <Text style={[styles.message, { color: tokens.colors.text.secondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
