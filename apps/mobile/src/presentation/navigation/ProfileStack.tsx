import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationsSettingsScreen } from '../screens/NotificationsSettingsScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { useTheme } from '../theme/useTheme';

export type ProfileStackParamList = {
  ProfileSettings: undefined;
  NotificationsSettings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
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
        name="ProfileSettings"
        component={ProfileSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationsSettings"
        component={NotificationsSettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
