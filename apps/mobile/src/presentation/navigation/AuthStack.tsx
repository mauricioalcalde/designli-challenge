import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SplashScreen } from '../screens/SplashScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthStackProps {
  includeSplash?: boolean;
  onSplashComplete?: () => void;
}

function SplashRoute({ onSplashComplete }: Pick<AuthStackProps, 'onSplashComplete'>) {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Splash'>>();

  return (
    <SplashScreen
      onFinish={() => {
        onSplashComplete?.();
        navigation.replace('Login', undefined);
      }}
    />
  );
}

/**
 * Auth stack — renders when `isAuthenticated` is false.
 * Contains launch splash + auth entry on cold start.
 */
export function AuthStack({ includeSplash = true, onSplashComplete }: AuthStackProps) {
  const SplashEntry = () => <SplashRoute onSplashComplete={onSplashComplete} />;

  return (
    <Stack.Navigator
      initialRouteName={includeSplash ? 'Splash' : 'Login'}
      screenOptions={{ headerShown: false }}
    >
      {includeSplash ? <Stack.Screen name="Splash" component={SplashEntry} /> : null}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
