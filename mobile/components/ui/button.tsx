import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
  icon?: React.ReactNode;
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
        return 'bg-blue-600';
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

  return (
    <TouchableOpacity
      className={`py-3 px-4 rounded-xl flex-row items-center justify-center min-h-[50px] ${getVariantStyles()} ${
        disabled || isLoading ? 'opacity-50' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? 'white' : '#4b5563'} />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-semibold text-center text-lg ${getTextStyles()}`}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
