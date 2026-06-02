import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import logoDesignli from '../../../../logoDesignli.jpeg';

interface MarketTopBarProps {
  onRefresh: () => void;
}

export function MarketTopBar({ onRefresh }: MarketTopBarProps) {
  const { tokens } = useTheme();

  return (
    <View style={styles.row}>
      <Image
        source={logoDesignli}
        resizeMode="contain"
        style={styles.logo}
        testID="stocks-topbar-logo"
      />

      <TouchableOpacity
        onPress={onRefresh}
        activeOpacity={0.7}
        style={styles.iconButton}
        testID="stocks-topbar-refresh"
      >
        <Ionicons name="refresh-outline" size={20} color={tokens.colors.text.secondary} />
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
  logo: {
    width: 36,
    height: 36,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
