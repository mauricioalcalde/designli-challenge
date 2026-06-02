import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface SegmentedControlOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  testID?: string;
}

export function SegmentedControl({ options, value, onChange, testID }: SegmentedControlProps) {
  const { tokens } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.bg.surface,
          borderColor: tokens.colors.border.subtle,
        },
      ]}
      testID={testID}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.7}
            onPress={() => {
              if (!isActive) {
                onChange(option.value);
              }
            }}
            style={[
              styles.segment,
              isActive && {
                backgroundColor: tokens.colors.primary,
                borderRadius: tokens.radii.md,
              },
            ]}
            testID={testID ? `${testID}-option-${option.value}` : `segmented-option-${option.value}`}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? tokens.colors.text.inverse : tokens.colors.text.secondary,
                  fontFamily: tokens.typography.bodySmall.fontFamily,
                  fontSize: tokens.typography.bodySmall.fontSize,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
