import React from 'react';
import { View, Text, ViewProps } from 'react-native';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: 'neutral' | 'success' | 'danger' | 'warning' | 'info';
}

export function Badge({ label, variant = 'neutral', className = '', ...props }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'danger':
        return 'bg-red-100 text-red-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'info':
        return 'bg-blue-100 text-blue-700';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const variantClass = getVariantStyles();
  const bgClass = variantClass.split(' ')[0];
  const textClass = variantClass.split(' ')[1];

  return (
    <View className={`px-2 py-1 rounded-md self-start ${bgClass} ${className}`} {...props}>
      <Text className={`text-xs font-medium ${textClass}`}>{label}</Text>
    </View>
  );
}
