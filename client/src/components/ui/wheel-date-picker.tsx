import { useState, useEffect, useLayoutEffect, useRef } from 'react';

interface WheelDatePickerProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (date: string) => void;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

const parseInitialValue = (value: string) => {
  if (value) {
    const date = new Date(value + 'T12:00:00');
    return {
      month: date.getMonth() + 1,
      day: date.getDate(),
      year: date.getFullYear()
    };
  }
  return {
    month: 1,
    day: 1,
    year: new Date().getFullYear()
  };
};

const ITEM_HEIGHT = 44;

const WheelDatePicker = ({ value, onChange }: WheelDatePickerProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 241 }, (_, i) => currentYear - 120 + i);
  
  const initialValue = parseInitialValue(value);
  const [selectedMonth, setSelectedMonth] = useState(initialValue.month);
  const [selectedDay, setSelectedDay] = useState(initialValue.day);
  const [selectedYear, setSelectedYear] = useState(initialValue.year);
  
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  
  // Track which wheel is being scrolled to prevent interference
  const activeWheel = useRef<string | null>(null);

  // Update parent when selection changes
  useEffect(() => {
    if (!isInitialized.current) return;
    const dateString = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    onChange(dateString);
  }, [selectedMonth, selectedDay, selectedYear, onChange]);

  // Validate day when month/year changes
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  // Direct scroll handlers - no debounce
  const handleMonthScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isInitialized.current) return;
    activeWheel.current = 'month';
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const newMonth = Math.max(1, Math.min(12, index + 1));
    if (newMonth !== selectedMonth) {
      setSelectedMonth(newMonth);
    }
  };

  const handleDayScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isInitialized.current) return;
    activeWheel.current = 'day';
    const scrollTop = e.currentTarget.scrollTop;
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const newDay = Math.max(1, Math.min(maxDays, index + 1));
    if (newDay !== selectedDay) {
      setSelectedDay(newDay);
    }
  };

  const handleYearScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isInitialized.current) return;
    activeWheel.current = 'year';
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.max(0, Math.min(years.length - 1, Math.round(scrollTop / ITEM_HEIGHT)));
    const newYear = years[index];
    if (newYear !== selectedYear) {
      setSelectedYear(newYear);
    }
  };

  // Initialize scroll positions on mount only
  useLayoutEffect(() => {
    if (monthRef.current) {
      monthRef.current.scrollTop = (initialValue.month - 1) * ITEM_HEIGHT;
    }
    if (dayRef.current) {
      dayRef.current.scrollTop = (initialValue.day - 1) * ITEM_HEIGHT;
    }
    if (yearRef.current) {
      yearRef.current.scrollTop = years.indexOf(initialValue.year) * ITEM_HEIGHT;
    }
    
    // Small delay to enable handlers after initial positioning
    setTimeout(() => {
      isInitialized.current = true;
    }, 50);
  }, []);

  const maxDays = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  const renderWheel = (
    items: (string | number)[],
    selectedValue: number,
    ref: React.RefObject<HTMLDivElement>,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void,
    width: string,
    testId: string,
    label: string,
    getItemValue: (item: string | number, index: number) => number
  ) => (
    <div className="relative flex flex-col items-center">
      <div className="text-xs text-gray-500 text-center mb-2 platypi-medium">{label}</div>
      <div className="relative">
        {/* Selection highlight - centered pink box */}
        <div 
          className="absolute left-0 right-0 pointer-events-none z-10"
          style={{ 
            top: '50%', 
            transform: 'translateY(-50%)',
            height: `${ITEM_HEIGHT}px`
          }}
        >
          <div className="w-full h-full bg-blush/20 rounded-lg border-2 border-blush" />
        </div>
        
        {/* Scroll container */}
        <div 
          ref={ref}
          className={`h-[132px] ${width} overflow-y-auto scrollbar-hide`}
          onScroll={onScroll}
          data-testid={testId}
        >
          {/* Top padding */}
          <div style={{ height: `${ITEM_HEIGHT}px` }} />
          
          {items.map((item, index) => {
            const itemValue = getItemValue(item, index);
            const isSelected = itemValue === selectedValue;
            return (
              <div
                key={`${item}-${index}`}
                className={`flex items-center justify-center text-sm platypi-medium ${
                  isSelected ? 'text-blush font-bold' : 'text-gray-500'
                }`}
                style={{ height: `${ITEM_HEIGHT}px` }}
              >
                {item}
              </div>
            );
          })}
          
          {/* Bottom padding */}
          <div style={{ height: `${ITEM_HEIGHT}px` }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center bg-white rounded-lg p-4 border border-blush/20 shadow-soft">
      <div className="flex items-center space-x-3">
        {renderWheel(
          months,
          selectedMonth,
          monthRef,
          handleMonthScroll,
          'w-24',
          'wheel-month',
          'Month',
          (_, index) => index + 1
        )}
        
        {renderWheel(
          days,
          selectedDay,
          dayRef,
          handleDayScroll,
          'w-14',
          'wheel-day',
          'Day',
          (item) => item as number
        )}
        
        {renderWheel(
          years,
          selectedYear,
          yearRef,
          handleYearScroll,
          'w-20',
          'wheel-year',
          'Year',
          (item) => item as number
        )}
      </div>
    </div>
  );
};

export default WheelDatePicker;
