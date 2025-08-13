import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useModalStore } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function TimesModals() {
  const { activeModal, closeModal } = useModalStore();
  const [eventTitle, setEventTitle] = useState("");
  const [englishDate, setEnglishDate] = useState(new Date().toISOString().split('T')[0]);
  const [convertedHebrewDate, setConvertedHebrewDate] = useState("");
  const [afterNightfall, setAfterNightfall] = useState(false);
  const [yearDuration, setYearDuration] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Convert today's date on component mount
  useEffect(() => {
    if (englishDate && !convertedHebrewDate) {
      convertToHebrewDate(englishDate, false);
    }
  }, [englishDate]);

  const handleMobileDownload = async () => {
    if (!eventTitle || !englishDate) {
      throw new Error('Please fill in both event title and English date');
    }

    // Starting calendar download
    
    try {
      // Build URL with query parameters using the same base URL logic as other API calls
      const params = new URLSearchParams({
        title: eventTitle,
        hebrewDate: convertedHebrewDate || '',
        gregorianDate: englishDate,
        years: yearDuration.toString()
      });
      
      // Use the same base URL logic as axiosClient
      let baseUrl = '';
      
      // Check if VITE_API_URL is set (production build)
      if (import.meta.env.VITE_API_URL) {
        baseUrl = import.meta.env.VITE_API_URL;
      } else if (window.location.hostname.includes('replit.dev')) {
        // For Replit preview, use port 5000
        const hostname = window.location.hostname;
        baseUrl = `https://${hostname}:5000`;
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development
        baseUrl = 'http://localhost:5000';
      }
      // If none of the above, baseUrl remains empty for relative URLs (production)
      
      const downloadUrl = `${baseUrl}/api/download-calendar?${params.toString()}`;
      
      // Downloading calendar file
      
      // Use window.open with a short timeout to handle download
      const downloadWindow = window.open(downloadUrl, '_self');
      
      // Fallback to link click if window.open fails
      if (!downloadWindow) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${yearDuration}_years.ics`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      }
      
      // Calendar download initiated
      return { success: true };
      
    } catch (error) {
      // Calendar download error occurred
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
      closeModal();
      // Navigate to home and scroll to progress
      window.location.hash = '#/?section=home&scrollToProgress=true';
    },
    onError: (error) => {
      // Download mutation error
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
      
      console.log(`Converting date: ${year}-${month}-${day} (after nightfall: ${isAfterNightfall})`);
      
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
        console.log(`Converted to Hebrew: ${data.hebrew}`);
      } else {
        throw new Error('No Hebrew date returned from API');
      }
    } catch (error) {
      console.error('Error converting date:', error);
      toast({
        title: "Conversion Error",
        description: "Unable to convert date. Please check the date and try again.",
        variant: "destructive"
      });
      setConvertedHebrewDate('');
    }
  };

  const handleDateChange = (date: string) => {
    setEnglishDate(date);
    if (date) {
      convertToHebrewDate(date, afterNightfall);
    }
  };

  const handleNightfallChange = (checked: boolean | string) => {
    const isChecked = checked === true;
    setAfterNightfall(isChecked);
    if (englishDate) {
      convertToHebrewDate(englishDate, isChecked);
    }
  };

  const toggleNightfall = () => {
    const newValue = !afterNightfall;
    setAfterNightfall(newValue);
    if (englishDate) {
      convertToHebrewDate(englishDate, newValue);
    }
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
      {/* Hebrew Date Calculator Modal */}
      <Dialog open={activeModal === 'date-calculator'} onOpenChange={() => closeModal(true)}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Hebrew Date Calculator</DialogTitle>
          </div>
          <p className="text-sm text-gray-600 mb-4 text-center">Convert English dates to Hebrew dates and add recurring events to your calendar</p>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm platypi-medium text-gray-700 mb-1">Event Title</Label>
              <Input 
                type="text" 
                placeholder="Anniversary, Yahrzeit, etc." 
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush bg-white"
              />
            </div>
            
            <div>
              <Label className="block text-sm platypi-medium text-gray-700 mb-1">English Date</Label>
              {typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent) ? (
                // iOS Custom Date Picker using select elements (wheel picker style)
                <div className="flex space-x-2">
                  <select 
                    value={englishDate ? new Date(englishDate).getMonth() + 1 : new Date().getMonth() + 1}
                    onChange={(e) => {
                      const currentDate = englishDate ? new Date(englishDate) : new Date();
                      const selectedMonth = parseInt(e.target.value) - 1; // Convert to 0-indexed
                      const currentDay = currentDate.getDate();
                      
                      // Check if the current day is valid for the new month
                      const daysInNewMonth = new Date(currentDate.getFullYear(), selectedMonth + 1, 0).getDate();
                      const validDay = Math.min(currentDay, daysInNewMonth);
                      
                      const newDate = new Date(currentDate.getFullYear(), selectedMonth, validDay);
                      handleDateChange(newDate.toISOString().split('T')[0]);
                    }}
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush bg-white text-gray-700"
                    style={{ minHeight: '48px' }}
                  >
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>
                        {new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select 
                    value={englishDate ? new Date(englishDate).getDate() : new Date().getDate()}
                    onChange={(e) => {
                      const currentDate = englishDate ? new Date(englishDate) : new Date();
                      // Fix the date construction to avoid off-by-one errors
                      const selectedDay = parseInt(e.target.value);
                      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
                      
                      // Ensure we're working with the correct date
                      if (newDate.getDate() === selectedDay) {
                        handleDateChange(newDate.toISOString().split('T')[0]);
                      }
                    }}
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush bg-white text-gray-700"
                    style={{ minHeight: '48px' }}
                  >
                    {(() => {
                      // Calculate valid days for the selected month/year
                      const currentDate = englishDate ? new Date(englishDate) : new Date();
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      
                      return Array.from({length: daysInMonth}, (_, i) => (
                        <option key={i+1} value={i+1}>{i+1}</option>
                      ));
                    })()}
                  </select>
                  <select 
                    value={englishDate ? new Date(englishDate).getFullYear() : new Date().getFullYear()}
                    onChange={(e) => {
                      const currentDate = englishDate ? new Date(englishDate) : new Date();
                      const selectedYear = parseInt(e.target.value);
                      const currentMonth = currentDate.getMonth();
                      const currentDay = currentDate.getDate();
                      
                      // Check if the current day is valid for the new year/month (leap year considerations)
                      const daysInMonth = new Date(selectedYear, currentMonth + 1, 0).getDate();
                      const validDay = Math.min(currentDay, daysInMonth);
                      
                      const newDate = new Date(selectedYear, currentMonth, validDay);
                      handleDateChange(newDate.toISOString().split('T')[0]);
                    }}
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush bg-white text-gray-700"
                    style={{ minHeight: '48px' }}
                  >
                    {Array.from({length: 150}, (_, i) => {
                      const year = new Date().getFullYear() - 100 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              ) : (
                // Standard date input for non-iOS devices
                <input 
                  type="date" 
                  value={englishDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush bg-white text-gray-700"
                  style={{ minHeight: '48px' }}
                />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div
                onClick={toggleNightfall}
                className={`h-5 w-5 border-2 border-blush rounded-sm cursor-pointer flex items-center justify-center transition-all ${
                  afterNightfall ? 'bg-blush' : 'bg-white hover:bg-gray-50'
                }`}
              >
                {afterNightfall && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <Label 
                onClick={toggleNightfall}
                className="text-sm text-gray-700 cursor-pointer"
              >
                After nightfall
              </Label>
            </div>
            
            {convertedHebrewDate && (
              <div>
                <Label className="block text-sm platypi-medium text-gray-700 mb-1">Hebrew Date</Label>
                <div className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                  {convertedHebrewDate}
                </div>
              </div>
            )}
            
            <div>
              <Label className="block text-sm platypi-medium text-gray-700 mb-1">Add to my calendar for the next:</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setYearDuration(1)}
                  className={`p-2 rounded-xl text-sm platypi-medium transition-all ${
                    yearDuration === 1
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  1 Year
                </button>
                <button
                  type="button"
                  onClick={() => setYearDuration(10)}
                  className={`p-2 rounded-xl text-sm platypi-medium transition-all ${
                    yearDuration === 10
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  10 Years
                </button>
                <button
                  type="button"
                  onClick={() => setYearDuration(120)}
                  className={`p-2 rounded-xl text-sm platypi-medium transition-all ${
                    yearDuration === 120
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  120 Years
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleDownloadCalendar}
                disabled={downloadCalendarMutation.isPending || !eventTitle || !englishDate}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
              >
                {downloadCalendarMutation.isPending ? "Generating..." : "Download Calendar"}
              </Button>
              
              {/* Hebcal Attribution */}
              <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
                <span className="text-sm platypi-medium text-black">
                  Zmanim and Date Converter are provided by{" "}
                  <a 
                    href="https://www.hebcal.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Hebcal
                  </a>
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}