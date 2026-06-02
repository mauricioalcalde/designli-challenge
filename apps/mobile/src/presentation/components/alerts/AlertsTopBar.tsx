import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useInboxStore } from '../../../application/inbox.store';
import { useTheme } from '../../theme/useTheme';
import logoDesignli from '../../../../logoDesignli.jpeg';

interface AlertsTopBarProps {
  onRefresh: () => void;
}

export function AlertsTopBar({ onRefresh: _onRefresh }: AlertsTopBarProps) {
  const { tokens } = useTheme();
  const navigation = useNavigation<any>();
  const unreadCount = useInboxStore((s) => s.unreadCount);

  return (
    <View style={styles.row}>
      <View style={styles.brandRow}>
        <Image source={logoDesignli} resizeMode="contain" style={styles.logo} />
      </View>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('Stocks', {
            screen: 'Inbox',
          })
        }
        activeOpacity={0.7}
        style={styles.iconButton}
        testID="alerts-topbar-notifications"
      >
        <Ionicons
          name="notifications-outline"
          size={20}
          color={tokens.colors.text.secondary}
          testID="alerts-topbar-bell-icon"
        />
        {unreadCount > 0 && (
          <View
            testID="alerts-topbar-badge"
            style={[styles.badge, { backgroundColor: tokens.colors.error }]}
          >
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 108,
    height: 28,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
