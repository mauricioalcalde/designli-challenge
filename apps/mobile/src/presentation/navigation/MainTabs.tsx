import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AlertsScreen } from '../screens/AlertsScreen';
import { NotificationsSettingsScreen } from '../screens/NotificationsSettingsScreen';
import { StocksScreen } from '../screens/StocksScreen';
import { StockChartScreen } from '../screens/StockChartScreen';
import type { StocksStackParamList } from '../screens/StocksScreen';

const Tab = createBottomTabNavigator();
const StocksStack = createNativeStackNavigator<StocksStackParamList>();

function StocksTab() {
  return (
    <StocksStack.Navigator>
      <StocksStack.Screen
        name="StocksList"
        component={StocksScreen}
        options={{ headerShown: false }}
      />
      <StocksStack.Screen
        name="StockChart"
        component={StockChartScreen}
        options={{ title: 'Chart' }}
      />
    </StocksStack.Navigator>
  );
}

/**
 * Main tabs shell — renders when `isAuthenticated` is true.
 * Stocks + Alerts content, with the notifications/settings shell.
 */
export function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Stocks" component={StocksTab} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsSettingsScreen} />
    </Tab.Navigator>
  );
}
