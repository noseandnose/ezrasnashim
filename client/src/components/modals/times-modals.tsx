import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import WheelDatePicker from "@/components/ui/wheel-date-picker";
import { Calendar, Gift } from "lucide-react";

export default function TimesModals() {
  const { activeModal, closeModal } = useModalStore();
  const [eventTitle, setEventTitle] = useState("");
  // Use local timezone date to avoid timezone issues
  const getLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  };
  const [englishDate, setEnglishDate] = useState(getLocalDate());
  const [convertedHebrewDate, setConvertedHebrewDate] = useState("");
  const [hebrewDateParts, setHebrewDateParts] = useState<{hd: number, hm: string, hy: number} | null>(null);
  const [dateObject, setDateObject] = useState<Date | null>(null);
  const [showEnglishFormat, setShowEnglishFormat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [afterNightfall, setAfterNightfall] = useState(false);
  const [yearDuration, setYearDuration] = useState(10);
  const [nextBirthday, setNextBirthday] = useState<string | null>(null);
  const [nextBirthdayLoading, setNextBirthdayLoading] = useState(false);
  const { toast } = useToast();
  useQueryClient();
  
  // Debounced conversion refs
  const conversionTimeoutRef = useRef<NodeJS.Timeout>();
  const lastConversionKeyRef = useRef<string>('');

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        (window.innerWidth <= 768);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounced conversion effect - handles API calls after user stops scrolling
  useEffect(() => {
    if (!englishDate) return;
    
    const conversionKey = `${englishDate}|${afterNightfall}`;
    if (conversionKey === lastConversionKeyRef.current) return;
    
    // Clear existing timeout
    if (conversionTimeoutRef.current) {
      clearTimeout(conversionTimeoutRef.current);
    }
    
    // Set new timeout for conversion
    conversionTimeoutRef.current = setTimeout(() => {
      convertToHebrewDate(englishDate, afterNightfall);
      lastConversionKeyRef.current = conversionKey;
    }, 500); // 500ms delay to prevent API spam
    
    return () => {
      if (conversionTimeoutRef.current) {
        clearTimeout(conversionTimeoutRef.current);
      }
    };
  }, [englishDate, afterNightfall]);


  const handleMobileDownload = async () => {
    if (!eventTitle || !englishDate) {
      throw new Error('Please fill in both event title and English date');
    }

    try {
      // Build URL with query parameters
      const params = new URLSearchParams({
        title: eventTitle,
        hebrewDate: convertedHebrewDate || '',
        gregorianDate: englishDate,
        years: yearDuration.toString(),
        afterNightfall: afterNightfall.toString()
      });
      
      // Use the same base URL logic as axiosClient
      let baseUrl = '';
      
      if (import.meta.env.VITE_API_URL) {
        baseUrl = import.meta.env.VITE_API_URL;
      } else if (window.location.hostname.includes('replit.dev')) {
        const hostname = window.location.hostname;
        baseUrl = `https://${hostname}:5000`;
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:5000';
      }
      
      const downloadUrl = `${baseUrl}/api/download-calendar?${params.toString()}`;
      
      // Detect iOS (iPhone, iPad, iPod)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        // iOS: Open URL directly - this triggers iOS Calendar import dialog
        window.location.href = downloadUrl;
        return { success: true };
      }
      
      // For other devices, use blob download
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to generate calendar file');
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${yearDuration}_years.ics`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      return { success: true };
      
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const downloadCalendarMutation = useMutation({
    mutationFn: handleMobileDownload,
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Calendar file downloaded for the next ${yearDuration} year${yearDuration > 1 ? 's' : ''} - Import into any calendar app`
      });
      setEventTitle("");
      setEnglishDate("");
      setConvertedHebrewDate("");
      setAfterNightfall(false);
      setYearDuration(10);
      setNextBirthday(null);
      closeModal();
      // Navigate to home and scroll to progress
      window.location.hash = '#/?section=home&scrollToProgress=true';
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to download calendar file: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Convert English date to Hebrew date using Hebcal
  const convertToHebrewDate = async (inputDate: string, isAfterNightfall: boolean) => {
    if (!inputDate) return;
    
    try {
      // Parse the date properly to avoid timezone issues
      const dateObj = new Date(inputDate + 'T12:00:00'); // Set to noon to avoid timezone issues
      
      // If after nightfall, add one day to get the next Hebrew date
      if (isAfterNightfall) {
        dateObj.setDate(dateObj.getDate() + 1);
      }
      
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1; // JavaScript months are 0-indexed
      const day = dateObj.getDate();
      
      const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`);
      
      if (!response.ok) {
        throw new Error(`Hebcal API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.hebrew) {
        setConvertedHebrewDate(data.hebrew);
        setDateObject(dateObj); // Store the date object for English formatting
        
        // Store Hebrew date parts for proper English conversion from Hebcal response
        if (data.hd && data.hm && data.hy) {
          setHebrewDateParts({
            hd: data.hd,
            hm: data.hm,
            hy: data.hy
          });
          
          // Calculate next occurrence of this Hebrew date
          calculateNextBirthday(data.hd, data.hm);
        }
        
        // Keep existing toggle state - don't reset to Hebrew
      } else {
        throw new Error('No Hebrew date returned from API');
      }
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: "Unable to convert date. Please check the date and try again.",
        variant: "destructive"
      });
      setConvertedHebrewDate('');
      setHebrewDateParts(null);
      setDateObject(null);
      setNextBirthday(null);
      // Keep existing toggle state on clear
    }
  };
  
  // Calculate the next occurrence of this Hebrew date in the Gregorian calendar
  const calculateNextBirthday = async (hebrewDay: number, hebrewMonth: string) => {
    setNextBirthdayLoading(true);
    try {
      // Get current Hebrew year
      const now = new Date();
      const currentYearResponse = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${now.getFullYear()}&gm=${now.getMonth() + 1}&gd=${now.getDate()}&g2h=1`);
      const currentData = await currentYearResponse.json();
      const currentHebrewYear = currentData.hy;
      
      // Try this year first, then next year
      for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
        const targetYear = currentHebrewYear + yearOffset;
        const response = await fetch(`https://www.hebcal.com/converter?cfg=json&hy=${targetYear}&hm=${hebrewMonth}&hd=${hebrewDay}&h2g=1`);
        const data = await response.json();
        
        if (data.gy && data.gm && data.gd) {
          const nextDate = new Date(data.gy, data.gm - 1, data.gd);
          // Check if this date is today or in the future (compare by date only, not time)
          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (nextDate >= todayMidnight) {
            const options: Intl.DateTimeFormatOptions = { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            };
            setNextBirthday(nextDate.toLocaleDateString('en-US', options));
            setNextBirthdayLoading(false);
            return;
          }
        }
      }
      setNextBirthday(null);
    } catch {
      setNextBirthday(null);
    }
    setNextBirthdayLoading(false);
  };

  // Format date in English with weekday and Hebrew components
  const formatEnglishDate = (dateObj: Date): string => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = weekdays[dateObj.getDay()];
    
    // Use Hebcal API fields for proper English formatting
    if (hebrewDateParts) {
      return `${weekday} ${hebrewDateParts.hd} ${hebrewDateParts.hm} ${hebrewDateParts.hy}`;
    }
    
    // Fallback if no Hebrew date parts
    return `${weekday} (conversion pending)`;
  };

  const handleDateChange = (date: string) => {
    setEnglishDate(date);
    // API conversion will be handled by debounced effect
    if (!date) {
      setConvertedHebrewDate('');
      setHebrewDateParts(null);
      setDateObject(null);
    }
  };

  const handleNightfallChange = (checked: boolean) => {
    setAfterNightfall(checked);
    // API conversion will be handled by debounced effect
  };


  const handleDownloadCalendar = () => {
    if (!eventTitle || !englishDate || !convertedHebrewDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    downloadCalendarMutation.mutate();
  };

  return (
    <>
      {/* Hebrew Date Calculator Fullscreen Modal */}
      <FullscreenModal
        isOpen={activeModal === 'date-calculator-fullscreen'}
        onClose={() => closeModal()}
        hideHeader={true}
        className="bg-gradient-to-br from-cream via-ivory to-sand"
      >
        <div className="max-w-lg mx-auto p-3" style={{ paddingTop: 'calc(var(--safe-area-top-resolved, 0px) + 1rem)' }}>
          {/* Header - close button provided by FullscreenModal */}
          <div className="flex items-center mb-4">
            <h1 className="text-lg platypi-bold text-black">Hebrew Date Calculator</h1>
          </div>
          
          {/* Form Sections */}
          <div className="space-y-3">
            {/* Event Title */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-soft border border-blush/10">
              <Label className="text-xs platypi-semibold text-black mb-1 flex items-center">
                Event Title
                <span className="text-blush ml-1">*</span>
              </Label>
              <Input 
                type="text" 
                placeholder="Anniversary, Yahrzeit, Birthday..." 
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-2 border-0 bg-gray-50/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blush/30 text-sm placeholder:text-gray-400 transition-all"
                data-testid="input-event-title"
              />
            </div>
            
            {/* Date Selection & Nightfall */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-soft border border-blush/10">
              <div className="flex items-start justify-between mb-1">
                <Label className="text-xs platypi-semibold text-black flex items-center">
                  Select Date
                  <span className="text-blush ml-1">*</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={afterNightfall}
                    onClick={() => handleNightfallChange(!afterNightfall)}
                    className="rounded-full transition-all duration-200 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      minWidth: '16px', 
                      minHeight: '16px',
                      backgroundColor: afterNightfall ? '#D4A5A5' : '#ffffff',
                      border: afterNightfall ? '2px solid #D4A5A5' : '2px solid rgba(212, 165, 165, 0.3)'
                    }}
                    data-testid="checkbox-nightfall"
                  >
                    {afterNightfall && (
                      <div className="rounded-full" style={{ width: '6px', height: '6px', backgroundColor: '#ffffff' }} />
                    )}
                  </button>
                  <Label 
                    onClick={() => handleNightfallChange(!afterNightfall)}
                    className="text-xs text-gray-600 cursor-pointer"
                  >
                    After nightfall?
                  </Label>
                </div>
              </div>
              {isMobile ? (
                <WheelDatePicker
                  value={englishDate || ''}
                  onChange={handleDateChange}
                />
              ) : (
                <input 
                  type="date"
                  value={englishDate || ''}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-2 border-0 bg-gray-50/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blush/30 text-sm transition-all"
                  data-testid="input-date"
                />
              )}
            </div>

            {/* Hebrew Date Result */}
            {convertedHebrewDate && (
              <div 
                className="bg-gradient-to-r from-blush/5 to-lavender/5 backdrop-blur-sm rounded-lg p-3 shadow-soft border border-blush/20 animate-in slide-in-from-bottom duration-300 cursor-pointer hover:border-blush/30 hover:shadow-md transition-all"
                onClick={() => setShowEnglishFormat(!showEnglishFormat)}
                data-testid="hebrew-date-display"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs platypi-semibold text-black flex items-center">
                      <span className="w-1.5 h-1.5 bg-blush rounded-full mr-2"></span>
                      {showEnglishFormat ? 'English Format' : 'Hebrew Date'}
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">Tap to {showEnglishFormat ? 'show Hebrew' : 'show English'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm platypi-semibold text-blush">
                      {showEnglishFormat && dateObject 
                        ? formatEnglishDate(dateObject)
                        : convertedHebrewDate
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Birthday/Anniversary Section */}
            {convertedHebrewDate && (
              <div 
                className="bg-gradient-to-r from-lavender/10 to-blush/10 backdrop-blur-sm rounded-lg p-3 shadow-soft border border-lavender/20 animate-in slide-in-from-bottom duration-300"
                data-testid="next-birthday-display"
              >
                <div className="flex items-center">
                  <Gift className="w-4 h-4 text-lavender mr-2" />
                  <div className="flex-1">
                    <Label className="text-xs platypi-semibold text-black flex items-center">
                      Next Occurrence
                    </Label>
                    <div className="text-sm platypi-semibold text-lavender mt-0.5">
                      {nextBirthdayLoading ? (
                        <span className="text-gray-400">Calculating...</span>
                      ) : nextBirthday ? (
                        nextBirthday
                      ) : (
                        <span className="text-gray-400">Unable to calculate</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Duration Selection */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-soft border border-blush/10">
              <Label className="text-xs platypi-semibold text-black mb-2 block">Calendar Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setYearDuration(1)}
                  className={`py-2 px-2 rounded-md text-xs platypi-semibold transition-all duration-200 ${
                    yearDuration === 1
                      ? 'bg-gradient-feminine text-white shadow-lg transform scale-105'
                      : 'bg-gray-50/70 border-2 border-blush/20 text-gray-700 hover:border-blush/40 hover:bg-white'
                  }`}
                  data-testid="button-1-year"
                >
                  <div className="text-sm mb-0.5">1</div>
                  <div className="text-xs opacity-90">Year</div>
                </button>
                <button
                  type="button"
                  onClick={() => setYearDuration(10)}
                  className={`py-2 px-2 rounded-md text-xs platypi-semibold transition-all duration-200 ${
                    yearDuration === 10
                      ? 'bg-gradient-feminine text-white shadow-lg transform scale-105'
                      : 'bg-gray-50/70 border-2 border-blush/20 text-gray-700 hover:border-blush/40 hover:bg-white'
                  }`}
                  data-testid="button-10-years"
                >
                  <div className="text-sm mb-0.5">10</div>
                  <div className="text-xs opacity-90">Years</div>
                </button>
                <button
                  type="button"
                  onClick={() => setYearDuration(120)}
                  className={`py-2 px-2 rounded-md text-xs platypi-semibold transition-all duration-200 ${
                    yearDuration === 120
                      ? 'bg-gradient-feminine text-white shadow-lg transform scale-105'
                      : 'bg-gray-50/70 border-2 border-blush/20 text-gray-700 hover:border-blush/40 hover:bg-white'
                  }`}
                  data-testid="button-120-years"
                >
                  <div className="text-sm mb-0.5">120</div>
                  <div className="text-xs opacity-90">Years</div>
                </button>
              </div>
            </div>
            
            {/* Download Button */}
            <div className="pt-1">
              <Button 
                onClick={handleDownloadCalendar}
                disabled={downloadCalendarMutation.isPending || !eventTitle || !englishDate}
                className="w-full bg-gradient-feminine text-white py-2.5 rounded-lg platypi-semibold text-sm border-0 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                data-testid="button-download-calendar"
              >
                {downloadCalendarMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating Calendar...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Calendar className="w-3 h-3 mr-2" />
                    Download Calendar
                  </div>
                )}
              </Button>
              
              {/* Attribution */}
              <div className="mt-1 text-center">
                <span className="text-xs text-gray-500 platypi-medium">
                  Powered by{" "}
                  <a 
                    href="https://www.hebcal.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blush hover:text-blush/80 underline transition-colors"
                  >
                    Hebcal
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </FullscreenModal>
    </>
  );
}