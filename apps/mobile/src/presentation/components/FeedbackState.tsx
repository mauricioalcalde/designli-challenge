import { Text, View } from 'react-native';
import { Badge } from './Badge';
import { Button } from './Button';
import { useTheme } from '../theme/useTheme';

type FeedbackType = 'success' | 'error' | 'offline' | 'pending';

interface FeedbackStateProps {
  type: FeedbackType;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  testID?: string;
}

function getFeedbackTone(type: FeedbackType): {
  label: string;
  variant: 'success' | 'error' | 'warning' | 'info';
} {
  switch (type) {
    case 'success':
      return { label: 'Saved', variant: 'success' };
    case 'error':
      return { label: 'Sync failed', variant: 'error' };
    case 'offline':
      return { label: 'Offline', variant: 'info' };
    case 'pending':
    default:
      return { label: 'Pending sync', variant: 'warning' };
  }
}

export function FeedbackState({ type, message, action, testID }: FeedbackStateProps) {
  const { tokens } = useTheme();
  const tone = getFeedbackTone(type);
  const messageTypography = tokens.typography.bodySmall;

  return (
    <View
      style={{
        backgroundColor: tokens.colors.bg.surface,
        borderColor: tokens.colors.border.subtle,
        borderWidth: 1,
        borderRadius: tokens.radius.card,
        padding: tokens.spacing.lg,
        gap: tokens.spacing.md,
      }}
      testID={testID}
    >
      <Badge text={tone.label} variant={tone.variant} />
      <Text
        style={{
          color: tokens.colors.text.secondary,
          fontFamily: messageTypography.fontFamily,
          fontSize: messageTypography.fontSize,
          lineHeight: messageTypography.lineHeight,
          fontWeight: messageTypography.fontWeight,
        }}
      >
        {message}
      </Text>

      {action ? (
        <View style={{ alignSelf: 'flex-start' }}>
          <Button
            title={action.label}
            variant="secondary"
            onPress={action.onPress}
            testID={testID ? `${testID}-action` : 'feedback-state-action'}
          />
        </View>
      ) : null}
    </View>
  );
}
