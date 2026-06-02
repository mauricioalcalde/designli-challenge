import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface SectionHeaderProps {
  title: string;
  description?: string;
  testID?: string;
}

export function SectionHeader({ title, description, testID }: SectionHeaderProps) {
  const { tokens } = useTheme();

  return (
    <View testID={testID} style={styles.container}>
      <Text
        style={{
          color: tokens.colors.text.primary,
          fontFamily: tokens.typography.title.fontFamily,
          fontSize: tokens.typography.title.fontSize,
          fontWeight: tokens.typography.title.fontWeight,
          lineHeight: tokens.typography.title.lineHeight,
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            marginTop: tokens.spacing.xs,
            color: tokens.colors.text.secondary,
            fontFamily: tokens.typography.bodySmall.fontFamily,
            fontSize: tokens.typography.bodySmall.fontSize,
            fontWeight: tokens.typography.bodySmall.fontWeight,
            lineHeight: tokens.typography.bodySmall.lineHeight,
          }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
