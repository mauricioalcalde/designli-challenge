import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface AuthFooterLinkProps {
  prefix: string;
  actionLabel: string;
  onPress: () => void;
  testID: string;
}

export function AuthFooterLink({ prefix, actionLabel, onPress, testID }: AuthFooterLinkProps) {
  const { tokens } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} testID={testID}>
      <Text
        style={[
          styles.text,
          {
            color: tokens.colors.text.secondary,
            fontSize: tokens.typography.bodySmall.fontSize,
            lineHeight: tokens.typography.bodySmall.lineHeight,
            fontFamily: tokens.typography.bodySmall.fontFamily,
          },
        ]}
      >
        {prefix}{' '}
        <Text
          style={{
            color: tokens.colors.primary,
            fontWeight: '600',
            fontFamily: tokens.typography.bodySmall.fontFamily,
          }}
        >
          {actionLabel}
        </Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
});
