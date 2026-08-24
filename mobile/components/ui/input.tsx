import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, className = '', ...props }: InputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>}
      <View
        className={`flex-row items-center border rounded-xl px-4 py-3 bg-gray-50 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-gray-900 text-base"
          placeholderTextColor="#9ca3af"
          {...props}
        />
      </View>
      {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
