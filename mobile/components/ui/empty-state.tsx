import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { Button } from './button';

interface EmptyStateProps extends ViewProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className = '', ...props }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-10 px-6 ${className}`} {...props}>
      {icon && <View className="mb-4 opacity-70">{icon}</View>}
      <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">{title}</Text>
      {description && <Text className="text-gray-500 text-center mb-6">{description}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} />
      )}
    </View>
  );
}
