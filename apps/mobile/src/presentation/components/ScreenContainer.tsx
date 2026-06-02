import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

interface ScreenContainerProps extends PropsWithChildren {
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function ScreenContainer({ children, testID, style }: ScreenContainerProps) {
  const { tokens } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.bg.canvas,
        },
        style,
      ]}
    >
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
