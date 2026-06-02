import { Text, View } from 'react-native';
import { Button } from './Button';
import { useTheme } from '../theme/useTheme';

type BannerVariant = 'info' | 'warning' | 'error';

interface BannerProps {
  message: string;
  variant?: BannerVariant;
  action?: {
    label: string;
    onPress: () => void;
    testID?: string;
  };
  testID?: string;
}

function getVariantColors(variant: BannerVariant, tokens: ReturnType<typeof useTheme>['tokens']) {
  switch (variant) {
    case 'error':
      return {
        borderColor: `${tokens.colors.error}55`,
        backgroundColor: `${tokens.colors.error}14`,
      };
    case 'warning':
      return {
        borderColor: `${tokens.colors.warning}55`,
        backgroundColor: `${tokens.colors.warning}16`,
      };
    case 'info':
    default:
      return {
        borderColor: `${tokens.colors.info}55`,
        backgroundColor: `${tokens.colors.info}14`,
      };
  }
}

export function Banner({ message, variant = 'info', action, testID }: BannerProps) {
  const { tokens } = useTheme();
  const colors = getVariantColors(variant, tokens);
  const messageTypography = tokens.typography.body;

  return (
    <View
      style={{
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        borderWidth: 1,
        borderRadius: tokens.radius.card,
        padding: tokens.spacing.lg,
      }}
      testID={testID}
    >
      <Text
        style={{
          color: tokens.colors.text.primary,
          fontFamily: messageTypography.fontFamily,
          fontSize: messageTypography.fontSize,
          lineHeight: messageTypography.lineHeight,
          fontWeight: messageTypography.fontWeight,
        }}
      >
        {message}
      </Text>

      {action ? (
        <View
          style={{ marginTop: tokens.spacing.md, alignSelf: 'flex-start' }}
          testID={testID ? `${testID}-action-row` : 'banner-action-row'}
        >
          <Button
            title={action.label}
            variant="secondary"
            onPress={action.onPress}
            testID={action.testID ?? (testID ? `${testID}-action` : 'banner-action')}
          />
        </View>
      ) : null}
    </View>
  );
}
