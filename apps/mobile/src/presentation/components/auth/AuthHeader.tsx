import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import logoDesignli from '../../../../logoDesignli.jpeg';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  const { tokens } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            borderColor: tokens.colors.border.subtle,
            backgroundColor: tokens.colors.bg.surface,
          },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            {
              color: tokens.colors.primary,
              fontSize: tokens.typography.caption.fontSize,
              lineHeight: tokens.typography.caption.lineHeight,
              fontWeight: tokens.typography.caption.fontWeight,
              fontFamily: tokens.typography.caption.fontFamily,
            },
          ]}
        >
          DESIGNLI
        </Text>
      </View>

      <Image
        source={logoDesignli}
        style={styles.logo}
        resizeMode="contain"
        testID="auth-header-logo"
      />

      <View style={styles.copyBlock}>
        <Text
          style={[
            styles.title,
            {
              color: tokens.colors.text.primary,
              fontSize: tokens.typography.h1.fontSize,
              lineHeight: tokens.typography.h1.lineHeight,
              fontWeight: tokens.typography.h1.fontWeight,
              fontFamily: tokens.typography.h1.fontFamily,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: tokens.colors.text.secondary,
              fontSize: tokens.typography.body.fontSize,
              lineHeight: tokens.typography.body.lineHeight,
              fontFamily: tokens.typography.body.fontFamily,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  badgeText: {
    letterSpacing: 2,
  },
  logo: {
    width: 92,
    height: 92,
  },
  copyBlock: {
    alignItems: 'center',
    gap: 8,
    maxWidth: 320,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
