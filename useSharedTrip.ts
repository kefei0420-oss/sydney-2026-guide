import { useState } from 'react';
import data from './trip.json';
export function useSharedTrip() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('plan');
  const [showLangPicker, setShowLangPicker] = useState(false);
  return { data, error: false, base: data.baseCurrency, convert: (amount: number) => amount,
    selectedDay, setSelectedDay, activeTab, setActiveTab, showLangPicker, setShowLangPicker };
}
