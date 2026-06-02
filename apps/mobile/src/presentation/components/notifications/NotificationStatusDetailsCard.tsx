import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface RowProps {
  label: string;
  value: string;
}

function Row({ label, value }: RowProps) {
  const { tokens } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>{label}</Text>
      <Text style={[styles.value, { color: tokens.colors.text.primary }]}>{value}</Text>
    </View>
  );
}

interface NotificationStatusDetailsCardProps {
  permissionStatus: string;
  registrationStatus: string;
  lastRegistered: string;
  platform: string;
  tokenPreview?: string | null;
}

export function NotificationStatusDetailsCard(props: NotificationStatusDetailsCardProps) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border.subtle }]}> 
      <Row label="Permission status" value={props.permissionStatus} />
      <Row label="Device registration" value={props.registrationStatus} />
      <Row label="Last registered" value={props.lastRegistered} />
      <Row label="Platform" value={props.platform} />
      {props.tokenPreview ? <Row label="Token" value={props.tokenPreview} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(184,192,212,0.12)',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
});
