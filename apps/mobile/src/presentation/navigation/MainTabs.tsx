import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StocksScreen } from '../screens/StocksScreen';
import { useTheme } from '../theme/useTheme';
import { AlertsStack } from './AlertsStack';
import { ProfileStack } from './ProfileStack';
import type { StocksStackParamList } from '../screens/StocksScreen';

const Tab = createBottomTabNavigator();
const StocksStack = createNativeStackNavigator<StocksStackParamList>();

function StocksTab() {
  const { tokens } = useTheme();

  return (
    <StocksStack.Navigator
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
      <StocksStack.Screen
        name="StocksList"
        component={StocksScreen}
        options={{ headerShown: false }}
      />
      <StocksStack.Screen
        name="StockChart"
        // eslint-disable-next-line @typescript-eslint/no-var-requires -- React Navigation getComponent expects a sync loader.
        getComponent={() => require('../screens/StockChartScreen').StockChartScreen}
        options={{ headerShown: false }}
      />
    </StocksStack.Navigator>
  );
}

/**
 * Main tabs shell — renders when `isAuthenticated` is true.
 * Stocks + Alerts content, with the notifications/settings shell.
 */
export function MainTabs() {
  const { tokens } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.brand.coral[500],
        tabBarInactiveTintColor: tokens.colors.neutral[300],
        tabBarStyle: {
          backgroundColor: tokens.colors.brand.navy[900],
          borderTopColor: tokens.colors.neutral[700],
        },
      }}
    >
      <Tab.Screen
        name="Stocks"
        component={StocksTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
