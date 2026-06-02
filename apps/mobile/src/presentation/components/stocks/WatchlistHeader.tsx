import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface WatchlistHeaderProps {
  title: string;
}

export function WatchlistHeader({ title }: WatchlistHeaderProps) {
  const { tokens } = useTheme();

  return (
    <View style={styles.row}>
      <Text
        style={{
          color: tokens.colors.text.primary,
          fontFamily: tokens.typography.body.fontFamily,
          fontSize: tokens.typography.body.fontSize,
          lineHeight: tokens.typography.body.lineHeight,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
