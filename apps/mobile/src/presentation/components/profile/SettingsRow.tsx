import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../Badge';
import { useTheme } from '../../theme/useTheme';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  badgeText?: string;
  badgeVariant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  onPress?: () => void;
  testID?: string;
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  badgeText,
  badgeVariant = 'neutral',
  onPress,
  testID,
}: SettingsRowProps) {
  const { tokens } = useTheme();
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      {...(onPress
        ? {
            onPress,
            activeOpacity: 0.75,
          }
        : {})}
      style={styles.row}
      testID={testID}
    >
      <Ionicons name={icon} size={20} color={tokens.colors.text.secondary} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: tokens.colors.text.primary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: tokens.colors.text.secondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {badgeText ? <Badge text={badgeText} variant={badgeVariant} /> : null}
      {value ? (
        <Text style={[styles.value, { color: tokens.colors.text.secondary }]}>{value}</Text>
      ) : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={tokens.colors.text.muted} />
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
  },
});
