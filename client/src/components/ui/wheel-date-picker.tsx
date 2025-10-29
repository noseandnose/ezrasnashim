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
  const suppressScrollHandlers = useRef(true);
  const isFirstRender = useRef(true);

  // Update from value prop only when it actually changes
  useEffect(() => {
    if (value) {
      const parsed = parseInitialValue(value);
      // Only update if different to avoid triggering re-scroll
      if (parsed.month !== selectedMonth) setSelectedMonth(parsed.month);
      if (parsed.day !== selectedDay) setSelectedDay(parsed.day);
      if (parsed.year !== selectedYear) setSelectedYear(parsed.year);
    }
  }, [value]);

  // Update parent when selection changes, but skip first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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

  const handleMonthScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (suppressScrollHandlers.current) return; // Suppress during programmatic scrolling
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = 40;
    const index = Math.round(scrollTop / itemHeight);
    const monthIndex = Math.max(0, Math.min(11, index));
    setSelectedMonth(monthIndex + 1);
  };

  const handleDayScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (suppressScrollHandlers.current) return; // Suppress during programmatic scrolling
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = 40;
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    const index = Math.round(scrollTop / itemHeight);
    const dayIndex = Math.max(0, Math.min(maxDays - 1, index));
    setSelectedDay(dayIndex + 1);
  };

  const handleYearScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (suppressScrollHandlers.current) return; // Suppress during programmatic scrolling
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = 40;
    const index = Math.round(scrollTop / itemHeight);
    const yearIndex = Math.max(0, Math.min(years.length - 1, index));
    setSelectedYear(years[yearIndex]);
  };

  // Use useLayoutEffect to scroll BEFORE paint - prevents visible jump
  useLayoutEffect(() => {
    const itemHeight = 40; // Match the h-10 class (40px)
    
    // Scroll all wheels to their initial positions synchronously
    if (monthRef.current) {
      monthRef.current.scrollTop = (selectedMonth - 1) * itemHeight;
    }
    if (dayRef.current) {
      dayRef.current.scrollTop = (selectedDay - 1) * itemHeight;
    }
    if (yearRef.current) {
      yearRef.current.scrollTop = years.indexOf(selectedYear) * itemHeight;
    }
    
    // Enable scroll handlers after a small delay
    setTimeout(() => {
      suppressScrollHandlers.current = false;
    }, 100);
  }, []);

  const maxDays = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center bg-white rounded-lg p-4 border border-blush/20 shadow-soft">
      <div className="flex items-center space-x-4">
        {/* Month Wheel */}
        <div className="relative">
          <div className="text-xs text-gray-500 text-center mb-2 platypi-medium">Month</div>
          <div 
            ref={monthRef}
            className="h-32 w-24 overflow-y-scroll scrollbar-hide"
            style={{ scrollSnapType: 'y mandatory' }}
            onScroll={handleMonthScroll}
            data-testid="wheel-month"
          >
            <div className="py-12"> {/* Padding to center items */}
              {months.map((month, index) => (
                <div
                  key={month}
                  className={`h-10 flex items-center justify-center text-sm platypi-medium ${
                    selectedMonth === index + 1
                      ? 'text-blush font-semibold'
                      : 'text-gray-600'
                  }`}
                  style={{ scrollSnapAlign: 'center' }}
                >
                  {month}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Day Wheel */}
        <div className="relative">
          <div className="text-xs text-gray-500 text-center mb-2 platypi-medium">Day</div>
          <div 
            ref={dayRef}
            className="h-32 w-16 overflow-y-scroll scrollbar-hide"
            style={{ scrollSnapType: 'y mandatory' }}
            onScroll={handleDayScroll}
            data-testid="wheel-day"
          >
            <div className="py-12">
              {days.map((day) => (
                <div
                  key={day}
                  className={`h-10 flex items-center justify-center text-sm platypi-medium ${
                    selectedDay === day
                      ? 'text-blush font-semibold'
                      : 'text-gray-600'
                  }`}
                  style={{ scrollSnapAlign: 'center' }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Year Wheel */}
        <div className="relative">
          <div className="text-xs text-gray-500 text-center mb-2 platypi-medium">Year</div>
          <div 
            ref={yearRef}
            className="h-32 w-20 overflow-y-scroll scrollbar-hide"
            style={{ scrollSnapType: 'y mandatory' }}
            onScroll={handleYearScroll}
            data-testid="wheel-year"
          >
            <div className="py-12">
              {years.map((year) => (
                <div
                  key={year}
                  className={`h-10 flex items-center justify-center text-sm platypi-medium ${
                    selectedYear === year
                      ? 'text-blush font-semibold'
                      : 'text-gray-600'
                  }`}
                  style={{ scrollSnapAlign: 'center' }}
                >
                  {year}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selection indicator lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full">
          <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2">
            <div className="h-px bg-blush/30 absolute top-0 left-4 right-4"></div>
            <div className="h-px bg-blush/30 absolute bottom-0 left-4 right-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelDatePicker;