import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AlertsListScreen } from '../screens/AlertsListScreen';
import { CreateAlertScreen } from '../screens/CreateAlertScreen';
import { useTheme } from '../theme/useTheme';

export type AlertsStackParamList = {
  AlertsList:
    | {
        createdDraft?: {
          id: string;
          symbol: string;
          threshold: number;
          direction: 'above' | 'below';
          status: 'pending' | 'failed';
        };
        feedback?: {
          tone: 'success' | 'info' | 'error';
          title: string;
          message: string;
        };
      }
    | undefined;
  CreateAlert:
    | {
        symbol?: string;
        currentPrice?: number;
      }
    | undefined;
};

const Stack = createNativeStackNavigator<AlertsStackParamList>();

export function AlertsStack() {
  const { tokens } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: tokens.colors.brand.navy[900],
        },
        headerTitleStyle: {
          color: tokens.colors.text.primary,
          fontFamily: tokens.typography.title.fontFamily,
          fontSize: tokens.typography.title.fontSize,
          fontWeight: '600',
        },
        headerTintColor: tokens.colors.text.primary,
      }}
    >
      <Stack.Screen
        name="AlertsList"
        component={AlertsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateAlert"
        component={CreateAlertScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
