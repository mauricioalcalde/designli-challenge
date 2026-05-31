import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AlertsScreen } from '../screens/AlertsScreen';
import { NotificationsSettingsScreen } from '../screens/NotificationsSettingsScreen';
import { StocksScreen } from '../screens/StocksScreen';

const Tab = createBottomTabNavigator();

/**
 * Main tabs shell — renders when `isAuthenticated` is true.
 * Stocks + Alerts content, with the notifications/settings shell.
 */
export function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Stocks" component={StocksScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsSettingsScreen} />
    </Tab.Navigator>
  );
}
