import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

import splashDesignli from '../../../splashDesignli.png';

interface SplashScreenProps {
  delayMs?: number;
  onFinish?: () => void;
}

export function SplashScreen({ delayMs = 1500, onFinish }: SplashScreenProps) {
  const { tokens } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    animation.start();

    const timer = setTimeout(() => {
      onFinish?.();
    }, delayMs);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [delayMs, onFinish, opacity]);

  return (
    <View
      testID="splash-screen"
      style={[styles.container, { backgroundColor: tokens.colors.brand.navy[900] }]}
    >
      <Animated.View style={[styles.content, { opacity }]}>
        <Image
          source={splashDesignli}
          resizeMode="cover"
          style={styles.splashImage}
          testID="splash-image"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});
