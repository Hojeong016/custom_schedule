'use client';

import { useState } from 'react';
import { useMediaQuery } from 'react-responsive';

interface MobileDatePickerProps {
  id?: string;
  value: string;
  onChange: (newValue: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
}

export default function MobileDatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder,
}: MobileDatePickerProps) {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [showPicker, setShowPicker] = useState(false);

  if (!isMobile) {
    // ✅ PC 웹에서는 그냥 input type="date"
    return (
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border px-2 py-1 rounded text-sm dark:text-black"
      />
    );
  }

  // ✅ 모바일에서는 버튼 누르면 date 입력
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="w-full border px-2 py-1 rounded text-sm dark:text-black bg-white text-left"
      >
        {value ? value : placeholder || '날짜 선택'}
      </button>

      {showPicker && (
        <input
          id={id}
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            onChange(e.target.value);
            setShowPicker(false); // 선택하면 닫기
          }}
          onBlur={() => setShowPicker(false)} // 포커스 잃으면 닫기
          autoFocus
          className="absolute top-full mt-1 border px-2 py-1 rounded text-sm dark:text-black bg-white"
        />
      )}
    </div>
  );
}
