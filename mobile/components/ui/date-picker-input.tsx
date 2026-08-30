import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

interface DatePickerInputProps {
  label?: string;
  value: Date | string | null;
  onChange: (date: Date) => void;
  error?: string;
  minimumDate?: Date;
}

export function DatePickerInput({ label, value, onChange, error, minimumDate }: DatePickerInputProps) {
  const [show, setShow] = useState(false);

  const onChangePicker = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    } else if (Platform.OS === 'ios' && selectedDate) {
      onChange(selectedDate);
    }
  };

  const formattedDate = value ? new Date(value).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '';

  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>}
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => setShow(true)}
        className={`flex-row items-center border rounded-xl px-4 py-3 bg-gray-50 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <View className="mr-3">
          <Calendar size={20} color="#9ca3af" />
        </View>
        <Text className={`flex-1 text-base ${formattedDate ? 'text-gray-900' : 'text-gray-400'}`}>
          {formattedDate || 'Pilih tanggal'}
        </Text>
      </TouchableOpacity>
      {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide">
          <TouchableOpacity 
            className="flex-1 justify-end bg-black/30" 
            activeOpacity={1} 
            onPress={() => setShow(false)}
          >
            <TouchableOpacity activeOpacity={1} className="bg-white pb-8 rounded-t-3xl pt-2">
              <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-gray-800">Pilih Tanggal</Text>
                <TouchableOpacity onPress={() => setShow(false)} className="px-2 py-1">
                  <Text className="text-indigo-600 font-bold text-base">Selesai</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode="date"
                display="spinner"
                onChange={onChangePicker}
                minimumDate={minimumDate}
                textColor="#000000"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={value ? new Date(value) : new Date()}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            onChange={onChangePicker}
          />
        )
      )}
    </View>
  );
}
