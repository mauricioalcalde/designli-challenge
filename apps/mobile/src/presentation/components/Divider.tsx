import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface DividerProps {
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ testID, style }: DividerProps) {
  const { tokens } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        {
          height: 1,
          width: '100%',
          backgroundColor: tokens.colors.border.subtle,
        },
        style,
      ]}
    />
  );
}
