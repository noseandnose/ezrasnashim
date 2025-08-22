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
        title="Hebrew Date Calculator"
        className="bg-gradient-to-br from-cream via-ivory to-sand"
      >
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div className="text-center mb-6">
            <p className="text-lg text-gray-700 platypi-medium">Convert English dates to Hebrew dates and add recurring events to your calendar</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <Label className="block text-lg platypi-semibold text-black mb-3">Event Title</Label>
              <Input 
                type="text" 
                placeholder="Anniversary, Yahrzeit, etc." 
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush bg-white text-lg"
              />
            </div>
            
            <div>
              <Label className="block text-lg platypi-semibold text-black mb-3">English Date</Label>
              <Input
                type="date"
                value={englishDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush bg-white text-lg"
              />
            </div>

            {convertedHebrewDate && (
              <div className="p-4 bg-gradient-feminine/10 border border-blush/20 rounded-xl">
                <Label className="block text-lg platypi-semibold text-black mb-2">Hebrew Date</Label>
                <div className="text-xl text-black platypi-medium bg-white/50 p-3 rounded-lg text-center">
                  {convertedHebrewDate}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
                <div>
                  <Label className="text-lg platypi-semibold text-black">After nightfall?</Label>
                  <p className="text-sm text-gray-600 mt-1">Select if the event occurs after sunset</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="nightfall-fullscreen"
                    checked={afterNightfall}
                    onCheckedChange={handleNightfallChange}
                    className="w-6 h-6"
                  />
                  <Label htmlFor="nightfall-fullscreen" className="text-lg platypi-medium text-black cursor-pointer">
                    {afterNightfall ? 'Yes' : 'No'}
                  </Label>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="block text-lg platypi-semibold text-black mb-3">Add to my calendar for the next:</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setYearDuration(1)}
                  className={`p-4 rounded-xl text-lg platypi-medium transition-all ${
                    yearDuration === 1
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border-2 border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  1 Year
                </button>
                <button
                  type="button"
                  onClick={() => setYearDuration(10)}
                  className={`p-4 rounded-xl text-lg platypi-medium transition-all ${
                    yearDuration === 10
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border-2 border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  10 Years
                </button>
                <button
                  type="button"
                  onClick={() => setYearDuration(120)}
                  className={`p-4 rounded-xl text-lg platypi-medium transition-all ${
                    yearDuration === 120
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border-2 border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  120 Years
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={handleDownloadCalendar}
                disabled={downloadCalendarMutation.isPending || !eventTitle || !englishDate}
                className="w-full bg-gradient-feminine text-white py-4 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300 text-lg"
              >
                {downloadCalendarMutation.isPending ? "Generating..." : "Download Calendar"}
              </Button>
              
              <div className="bg-blue-50 rounded-2xl px-4 py-4 mt-4 border border-blue-200">
                <span className="text-lg platypi-medium text-black">
                  Date converter powered by{" "}
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
        </div>
      </FullscreenModal>
    </>
  );
}