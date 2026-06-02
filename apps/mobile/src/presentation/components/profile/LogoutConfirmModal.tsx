import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface LogoutConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ visible, onCancel, onConfirm }: LogoutConfirmModalProps) {
  const { tokens } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border.subtle }]}> 
          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>Logout</Text>
          <Text style={[styles.message, { color: tokens.colors.text.secondary }]}>Are you sure you want to sign out?</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.75} style={[styles.button, { borderColor: tokens.colors.border.subtle }]}> 
              <Text style={[styles.buttonText, { color: tokens.colors.text.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} activeOpacity={0.75} style={[styles.button, { backgroundColor: 'rgba(239,95,103,0.14)', borderColor: tokens.colors.error }]}> 
              <Text style={[styles.buttonText, { color: tokens.colors.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
});
