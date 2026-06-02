import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';

interface AlertPreviewCardProps {
  message: string;
  complete: boolean;
}

export function AlertPreviewCard({ message, complete }: AlertPreviewCardProps) {
  const { tokens } = useTheme();
  const accent = complete ? tokens.colors.success : tokens.colors.text.muted;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border.subtle,
        },
      ]}
      testID="create-alert-preview-card"
    >
      <Ionicons name="notifications-outline" size={22} color={accent} />
      <Text
        style={[
          styles.message,
          { color: complete ? tokens.colors.text.primary : tokens.colors.text.secondary },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  message: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});
