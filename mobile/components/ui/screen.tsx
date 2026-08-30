import React from 'react';
import { View, SafeAreaView, ViewProps } from 'react-native';

interface ScreenProps extends ViewProps {
  safeArea?: boolean;
}

export function Screen({ children, safeArea = true, className = '', ...props }: ScreenProps) {
  const content = (
    <View className={`flex-1 bg-theme-bg ${className}`} {...props}>
      {children}
    </View>
  );

  if (safeArea) {
    return <SafeAreaView className="flex-1 bg-theme-bg">{content}</SafeAreaView>;
  }

  return content;
}
