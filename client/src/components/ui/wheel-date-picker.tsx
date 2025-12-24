import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

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

// Parse initial value to prevent default state mismatch
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
  const years = Array.from({ length: 241 }, (_, i) => currentYear - 120 + i); // ±120 years
  
  // Initialize state from value to prevent initial jump
  const initialValue = parseInitialValue(value);
  const [selectedMonth, setSelectedMonth] = useState(initialValue.month);
  const [selectedDay, setSelectedDay] = useState(initialValue.day);
  const [selectedYear, setSelectedYear] = useState(initialValue.year);
  
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const scrollTimeouts = useRef<{ month?: NodeJS.Timeout; day?: NodeJS.Timeout; year?: NodeJS.Timeout }>({});

  // Update from value prop only when it actually changes from outside
  useEffect(() => {
    if (value && isInitialized.current) {
      const parsed = parseInitialValue(value);
      if (parsed.month !== selectedMonth) setSelectedMonth(parsed.month);
      if (parsed.day !== selectedDay) setSelectedDay(parsed.day);
      if (parsed.year !== selectedYear) setSelectedYear(parsed.year);
    }
  }, [value]);

  // Update parent when selection changes
  useEffect(() => {
    if (!isInitialized.current) return;
    const dateString = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    onChange(dateString);
  }, [selectedMonth, selectedDay, selectedYear, onChange]);

  // Validate and adjust day when month or year changes
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  // Debounced scroll handler factory
  const createScrollHandler = useCallback((
    type: 'month' | 'day' | 'year',
    setter: (val: number) => void,
    getIndex: (scrollTop: number) => number
  ) => {
    return (e: React.UIEvent<HTMLDivElement>) => {
      if (!isInitialized.current) return;
      
      const scrollTop = e.currentTarget.scrollTop;
      const index = getIndex(scrollTop);
      
      // Clear existing timeout
      if (scrollTimeouts.current[type]) {
        clearTimeout(scrollTimeouts.current[type]);
      }
      
      // Debounce the state update
      scrollTimeouts.current[type] = setTimeout(() => {
        setter(index);
      }, 50);
    };
  }, []);

  const handleMonthScroll = createScrollHandler(
    'month',
    (idx) => setSelectedMonth(idx),
    (scrollTop) => Math.max(1, Math.min(12, Math.round(scrollTop / ITEM_HEIGHT) + 1))
  );

  const handleDayScroll = createScrollHandler(
    'day',
    (idx) => setSelectedDay(idx),
    (scrollTop) => {
      const maxDays = getDaysInMonth(selectedYear, selectedMonth);
      return Math.max(1, Math.min(maxDays, Math.round(scrollTop / ITEM_HEIGHT) + 1));
    }
  );

  const handleYearScroll = createScrollHandler(
    'year',
    (idx) => setSelectedYear(idx),
    (scrollTop) => {
      const yearIndex = Math.max(0, Math.min(years.length - 1, Math.round(scrollTop / ITEM_HEIGHT)));
      return years[yearIndex];
    }
  );

  // Scroll to position helper
  const scrollToPosition = useCallback((ref: React.RefObject<HTMLDivElement>, index: number) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'instant'
      });
    }
  }, []);

  // Initialize scroll positions on mount
  useLayoutEffect(() => {
    scrollToPosition(monthRef, selectedMonth - 1);
    scrollToPosition(dayRef, selectedDay - 1);
    scrollToPosition(yearRef, years.indexOf(selectedYear));
    
    // Enable scroll handlers after positions are set
    requestAnimationFrame(() => {
      isInitialized.current = true;
    });
  }, []);

  // Update scroll position when state changes from clicking
  useEffect(() => {
    if (!isInitialized.current) return;
    // Only scroll if the position is off
    if (monthRef.current) {
      const expectedScroll = (selectedMonth - 1) * ITEM_HEIGHT;
      if (Math.abs(monthRef.current.scrollTop - expectedScroll) > ITEM_HEIGHT / 2) {
        scrollToPosition(monthRef, selectedMonth - 1);
      }
    }
  }, [selectedMonth, scrollToPosition]);

  useEffect(() => {
    if (!isInitialized.current) return;
    if (dayRef.current) {
      const expectedScroll = (selectedDay - 1) * ITEM_HEIGHT;
      if (Math.abs(dayRef.current.scrollTop - expectedScroll) > ITEM_HEIGHT / 2) {
        scrollToPosition(dayRef, selectedDay - 1);
      }
    }
  }, [selectedDay, scrollToPosition]);

  useEffect(() => {
    if (!isInitialized.current) return;
    if (yearRef.current) {
      const yearIndex = years.indexOf(selectedYear);
      const expectedScroll = yearIndex * ITEM_HEIGHT;
      if (Math.abs(yearRef.current.scrollTop - expectedScroll) > ITEM_HEIGHT / 2) {
        scrollToPosition(yearRef, yearIndex);
      }
    }
  }, [selectedYear, years, scrollToPosition]);

  const maxDays = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  // Wheel component with selection highlight
  const Wheel = ({ 
    items, 
    selectedValue, 
    refProp, 
    onScroll, 
    width,
    testId,
    label,
    getValue
  }: { 
    items: (string | number)[];
    selectedValue: number | string;
    refProp: React.RefObject<HTMLDivElement>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    width: string;
    testId: string;
    label: string;
    getValue: (item: string | number) => number | string;
  }) => (
    <div className="relative flex flex-col items-center">
      <div className="text-xs text-gray-500 text-center mb-2 platypi-medium">{label}</div>
      <div className="relative">
        {/* Selection highlight box */}
        <div 
          className="absolute left-0 right-0 pointer-events-none z-10"
          style={{ 
            top: '50%', 
            transform: 'translateY(-50%)',
            height: `${ITEM_HEIGHT}px`
          }}
        >
          <div className="w-full h-full bg-blush/15 rounded-lg border-2 border-blush/40" />
        </div>
        
        {/* Scroll container */}
        <div 
          ref={refProp}
          className={`h-[132px] ${width} overflow-y-auto scrollbar-hide relative`}
          onScroll={onScroll}
          data-testid={testId}
        >
          {/* Top padding to center first item */}
          <div style={{ height: `${ITEM_HEIGHT}px` }} />
          
          {items.map((item, index) => {
            const itemValue = getValue(item);
            const isSelected = itemValue === selectedValue;
            return (
              <div
                key={`${item}-${index}`}
                className={`flex items-center justify-center text-sm platypi-medium transition-all duration-150 ${
                  isSelected
                    ? 'text-blush font-bold scale-110'
                    : 'text-gray-500'
                }`}
                style={{ height: `${ITEM_HEIGHT}px` }}
              >
                {item}
              </div>
            );
          })}
          
          {/* Bottom padding to center last item */}
          <div style={{ height: `${ITEM_HEIGHT}px` }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center bg-white rounded-lg p-4 border border-blush/20 shadow-soft">
      <div className="flex items-center space-x-3">
        <Wheel
          items={months}
          selectedValue={selectedMonth}
          refProp={monthRef}
          onScroll={handleMonthScroll}
          width="w-24"
          testId="wheel-month"
          label="Month"
          getValue={(item) => months.indexOf(item as string) + 1}
        />
        
        <Wheel
          items={days}
          selectedValue={selectedDay}
          refProp={dayRef}
          onScroll={handleDayScroll}
          width="w-14"
          testId="wheel-day"
          label="Day"
          getValue={(item) => item as number}
        />
        
        <Wheel
          items={years}
          selectedValue={selectedYear}
          refProp={yearRef}
          onScroll={handleYearScroll}
          width="w-20"
          testId="wheel-year"
          label="Year"
          getValue={(item) => item as number}
        />
      </div>
    </div>
  );
};

export default WheelDatePicker;
