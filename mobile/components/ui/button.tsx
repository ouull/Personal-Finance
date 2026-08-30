import React from 'react';
import { Text, ActivityIndicator, Pressable, PressableProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function Button({
  label,
  variant = 'primary',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 border border-gray-200';
      case 'danger':
        return 'bg-red-500';
      case 'outline':
        return 'bg-transparent border border-gray-300';
      case 'primary':
      default:
        return 'bg-black';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'secondary':
      case 'outline':
        return 'text-gray-900';
      case 'danger':
      case 'primary':
      default:
        return 'text-white';
    }
  };

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    if (props.onPressIn) props.onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    if (props.onPressOut) props.onPressOut(e);
  };

  return (
    <AnimatedPressable
      className={`py-3.5 px-4 rounded-full flex-row items-center justify-center min-h-[52px] ${getVariantStyles()} ${
        disabled || isLoading ? 'opacity-50' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? 'white' : '#4b5563'} />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-bold text-center text-base ${getTextStyles()}`}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}
