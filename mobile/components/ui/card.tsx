import React from 'react';
import { View, ViewProps } from 'react-native';

export function Card({ className = '', children, ...props }: ViewProps) {
  return (
    <View
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
