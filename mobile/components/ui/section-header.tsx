import React from 'react';
import { View, Text, ViewProps } from 'react-native';

interface SectionHeaderProps extends ViewProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, action, className = '', ...props }: SectionHeaderProps) {
  return (
    <View className={`flex-row justify-between items-end mb-3 ${className}`} {...props}>
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
      {action && <View>{action}</View>}
    </View>
  );
}
