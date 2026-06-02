import React, { useEffect, useRef } from 'react';
import { Animated, type DimensionValue } from 'react-native';
import { useTheme } from '../theme/useTheme';

// ---------------------------------------------------------------------------
// Base Skeleton — animated pulse background
// ---------------------------------------------------------------------------

interface SkeletonBaseProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  testID?: string;
}

function SkeletonBase({ width, height, borderRadius = 4, testID }: SkeletonBaseProps) {
  const { tokens } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  // Determine pulse color: light surface vs dark surface
  const baseColor = tokens.colors.surface;
  // Animated opacity is applied on top of the surface color

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: baseColor,
        opacity: anim,
      }}
      testID={testID}
    />
  );
}

// ---------------------------------------------------------------------------
// Skeleton subcomponents
// ---------------------------------------------------------------------------

interface SkeletonLineProps {
  width?: DimensionValue;
  height?: number;
  testID?: string;
}

function SkeletonLine({ width = '70%', height = 16, testID }: SkeletonLineProps) {
  return <SkeletonBase width={width} height={height} borderRadius={4} testID={testID} />;
}

interface SkeletonCardProps {
  width?: DimensionValue;
  height?: number;
  testID?: string;
}

function SkeletonCard({ width = '90%', height = 80, testID }: SkeletonCardProps) {
  return <SkeletonBase width={width} height={height} borderRadius={12} testID={testID} />;
}

interface SkeletonCircleProps {
  size: number;
  testID?: string;
}

function SkeletonCircle({ size, testID }: SkeletonCircleProps) {
  return <SkeletonBase width={size} height={size} borderRadius={size / 2} testID={testID} />;
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Skeleton = {
  Line: SkeletonLine,
  Card: SkeletonCard,
  Circle: SkeletonCircle,
};
