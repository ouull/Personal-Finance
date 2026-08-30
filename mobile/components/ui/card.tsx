import React from 'react';
import { View, ViewProps, Pressable, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({ className = '', children, ...props }: ViewProps) {
  return (
    <View
      className={`bg-theme-card rounded-2xl p-5 border border-theme-border shadow-none ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

export function PressableCard({ className = '', children, disabled, ...props }: PressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: any) => {
    if (!disabled) scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    if (props.onPressIn) props.onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    if (!disabled) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    if (props.onPressOut) props.onPressOut(e);
  };

  return (
    <AnimatedPressable
      className={`bg-theme-card rounded-2xl p-5 border border-theme-border shadow-none ${className} ${disabled ? 'opacity-70' : ''}`}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      disabled={disabled}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
