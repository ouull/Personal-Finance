import React from 'react';
import { View, SafeAreaView, ViewProps } from 'react-native';

interface ScreenProps extends ViewProps {
  safeArea?: boolean;
}

export function Screen({ children, safeArea = true, className = '', ...props }: ScreenProps) {
  const content = (
    <View className={`flex-1 bg-gray-50 ${className}`} {...props}>
      {children}
    </View>
  );

  if (safeArea) {
    return <SafeAreaView className="flex-1 bg-gray-50">{content}</SafeAreaView>;
  }

  return content;
}
