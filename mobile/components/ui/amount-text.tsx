import React from 'react';
import { Text, TextProps } from 'react-native';

interface AmountTextProps extends TextProps {
  amount: number;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INITIAL_BALANCE' | 'NEUTRAL';
  showSign?: boolean;
}

export function AmountText({ amount, type = 'NEUTRAL', showSign = true, className = '', ...props }: AmountTextProps) {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  const getStyle = () => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600';
      case 'EXPENSE':
        return 'text-red-600';
      default:
        return 'text-gray-900';
    }
  };

  const getSign = () => {
    if (!showSign || type === 'NEUTRAL' || type === 'TRANSFER' || type === 'INITIAL_BALANCE') return '';
    return type === 'EXPENSE' ? '-' : '+';
  };

  return (
    <Text className={`${getStyle()} ${className}`} {...props}>
      {getSign()}{formatted}
    </Text>
  );
}
