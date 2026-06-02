import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';

interface MarketSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
  testID?: string;
}

export function MarketSearchBar({ value, onChangeText, onClear, testID }: MarketSearchBarProps) {
  const { tokens } = useTheme();

  return (
    <View style={styles.row} testID={testID}>
      <View
        style={[
          styles.search,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border.subtle,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={tokens.colors.text.muted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search stocks..."
          placeholderTextColor={tokens.colors.text.muted}
          style={[
            styles.input,
            {
              color: tokens.colors.text.primary,
              fontFamily: tokens.typography.body.fontFamily,
              fontSize: tokens.typography.body.fontSize,
              lineHeight: tokens.typography.body.lineHeight,
            },
          ]}
          testID="stocks-search-input"
        />
        {value ? (
          <TouchableOpacity onPress={onClear} activeOpacity={0.7} testID="stocks-search-clear">
            <Ionicons name="close-circle" size={18} color={tokens.colors.text.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
  },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
  },
});
