import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ChartRange } from '@designli-challenge/shared';
import { useTheme } from '../../theme/useTheme';

interface TimeRangeSelectorProps {
  value: ChartRange;
  options: ChartRange[];
  onChange: (range: ChartRange) => void;
}

export function TimeRangeSelector({ value, options, onChange }: TimeRangeSelectorProps) {
  const { tokens } = useTheme();

  return (
    <View style={styles.row} testID="stock-time-range-selector">
      {options.map((range) => {
        const active = range === value;
        return (
          <TouchableOpacity
            key={range}
            onPress={() => onChange(range)}
            activeOpacity={0.7}
            style={[
              styles.pill,
              {
                backgroundColor: active ? tokens.colors.primary : tokens.colors.surface,
                borderColor: active ? tokens.colors.primary : tokens.colors.border.subtle,
              },
            ]}
            testID={`chart-timeframe-${range}`}
          >
            <Text
              style={{
                color: active ? '#FFFFFF' : tokens.colors.text.secondary,
                fontFamily: tokens.typography.caption.fontFamily,
                fontSize: tokens.typography.caption.fontSize,
                lineHeight: tokens.typography.caption.lineHeight,
                fontWeight: '600',
              }}
            >
              {range}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
