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
import { FullscreenModal } from "@/components/ui/fullscreen-modal";

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

    try {
      // Build URL with query parameters using the same base URL logic as other API calls
      const params = new URLSearchParams({
        title: eventTitle,
        hebrewDate: convertedHebrewDate || '',
        gregorianDate: englishDate,
        years: yearDuration.toString(),
        afterNightfall: afterNightfall.toString()
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
      {/* Hebrew Date Calculator Fullscreen Modal */}
      <FullscreenModal
        isOpen={activeModal === 'date-calculator-fullscreen'}
        onClose={() => closeModal()}
        title="Hebrew Date Converter"
        className="bg-gradient-to-br from-cream via-ivory to-sand"
      >
        <div className="max-w-lg mx-auto p-6">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-feminine rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg platypi-semibold text-black mb-2">Convert English to Hebrew Dates</h2>
            <p className="text-sm text-gray-600 platypi-medium">Create calendar events that recur yearly on the Hebrew calendar</p>
          </div>
          
          {/* Form Sections */}
          <div className="space-y-6">
            {/* Event Title */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-blush/10">
              <Label className="text-base platypi-semibold text-black mb-3 flex items-center">
                Event Title
                <span className="text-blush ml-1">*</span>
              </Label>
              <Input 
                type="text" 
                placeholder="Anniversary, Yahrzeit, Birthday..." 
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-4 border-0 bg-gray-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush/30 text-base placeholder:text-gray-400 transition-all"
                data-testid="input-event-title"
              />
            </div>
            
            {/* Date Selection */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-blush/10">
              <Label className="text-base platypi-semibold text-black mb-3 flex items-center">
                Select Date
                <span className="text-blush ml-1">*</span>
              </Label>
              <input 
                type="date"
                value={englishDate || ''}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full p-4 border-0 bg-gray-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush/30 text-base transition-all appearance-none"
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
                data-testid="input-date"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                This will open your phone's native date picker
              </p>
            </div>

            {/* Hebrew Date Result */}
            {convertedHebrewDate && (
              <div className="bg-gradient-to-r from-blush/5 to-lavender/5 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-blush/20 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base platypi-semibold text-black flex items-center mb-1">
                      <span className="w-2 h-2 bg-blush rounded-full mr-2"></span>
                      Hebrew Date
                    </Label>
                    <p className="text-xs text-gray-600">This will be the recurring date</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg platypi-semibold text-blush">
                      {convertedHebrewDate}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nightfall Option */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-blush/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label className="text-base platypi-semibold text-black mb-2 block">After nightfall?</Label>
                  <p className="text-sm text-gray-600">Check if the event occurs after sunset (affects the Hebrew date calculation)</p>
                </div>
                <div className="ml-4">
                  <Checkbox
                    id="nightfall-fullscreen"
                    checked={afterNightfall}
                    onCheckedChange={handleNightfallChange}
                    className="w-6 h-6 border-2 border-blush/30 data-[state=checked]:bg-blush data-[state=checked]:border-blush"
                    data-testid="checkbox-nightfall"
                  />
                </div>
              </div>
            </div>
            
            {/* Duration Selection */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-blush/10">
              <Label className="text-base platypi-semibold text-black mb-4 block">Calendar Duration</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setYearDuration(1)}
                  className={`py-4 px-3 rounded-xl text-sm platypi-semibold transition-all duration-200 ${
                    yearDuration === 1
                      ? 'bg-gradient-feminine text-white shadow-lg transform scale-105'
                      : 'bg-gray-50/70 border-2 border-blush/20 text-gray-700 hover:border-blush/40 hover:bg-white'
                  }`}
                  data-testid="button-1-year"
                >
                  <div className="text-lg mb-1">1</div>
                  <div className="text-xs opacity-90">Year</div>
                </button>
                <button
                  type="button"
                  onClick={() => setYearDuration(10)}
                  className={`py-4 px-3 rounded-xl text-sm platypi-semibold transition-all duration-200 ${
                    yearDuration === 10
                      ? 'bg-gradient-feminine text-white shadow-lg transform scale-105'
                      : 'bg-gray-50/70 border-2 border-blush/20 text-gray-700 hover:border-blush/40 hover:bg-white'
                  }`}
                  data-testid="button-10-years"
                >
                  <div className="text-lg mb-1">10</div>
                  <div className="text-xs opacity-90">Years</div>
                </button>
                <button
                  type="button"
                  onClick={() => setYearDuration(120)}
                  className={`py-4 px-3 rounded-xl text-sm platypi-semibold transition-all duration-200 ${
                    yearDuration === 120
                      ? 'bg-gradient-feminine text-white shadow-lg transform scale-105'
                      : 'bg-gray-50/70 border-2 border-blush/20 text-gray-700 hover:border-blush/40 hover:bg-white'
                  }`}
                  data-testid="button-120-years"
                >
                  <div className="text-lg mb-1">120</div>
                  <div className="text-xs opacity-90">Years</div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">Select how many years to add recurring events</p>
            </div>
            
            {/* Download Button */}
            <div className="pt-4">
              <Button 
                onClick={handleDownloadCalendar}
                disabled={downloadCalendarMutation.isPending || !eventTitle || !englishDate}
                className="w-full bg-gradient-feminine text-white py-4 rounded-2xl platypi-semibold text-base border-0 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                data-testid="button-download-calendar"
              >
                {downloadCalendarMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating Calendar...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Download Calendar
                  </div>
                )}
              </Button>
              
              {/* Attribution */}
              <div className="mt-4 text-center">
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