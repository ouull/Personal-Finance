import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface IconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  ...props
}: IconButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600';
      case 'secondary':
        return 'bg-gray-100';
      case 'ghost':
      default:
        return 'bg-transparent';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'p-2';
      case 'lg':
        return 'p-4';
      case 'md':
      default:
        return 'p-3';
    }
  };

  return (
    <TouchableOpacity
      className={`rounded-full items-center justify-center ${getVariantStyles()} ${getSizeStyles()} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
    </TouchableOpacity>
  );
}
