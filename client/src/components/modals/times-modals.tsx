import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useModalStore } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function TimesModals() {
  const { activeModal, closeModal } = useModalStore();
  const [eventTitle, setEventTitle] = useState("");
  const [englishDate, setEnglishDate] = useState("");
  const [convertedHebrewDate, setConvertedHebrewDate] = useState("");
  const [afterNightfall, setAfterNightfall] = useState(false);
  const [yearDuration, setYearDuration] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleMobileDownload = async () => {
    if (!eventTitle || !englishDate) {
      throw new Error('Please fill in both event title and English date');
    }

    // Detect mobile browser for better handling
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.log('Mobile download attempt:', { isIOS, isAndroid, userAgent: navigator.userAgent.substring(0, 50) });
    }

    // Create form for both mobile and desktop
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = import.meta.env.DEV 
      ? 'http://localhost:5000/api/calendar-events/download' 
      : '/api/calendar-events/download';
    
    // Mobile browsers may have issues with _blank target
    if (isMobile) {
      form.target = '_self'; // Try _self for mobile to avoid popup blocking
      console.log('Using mobile-optimized form submission with _self target');
    } else {
      form.target = '_blank';
    }
    
    form.style.display = 'none';

    // Add form fields
    const fields = [
      { name: 'title', value: eventTitle },
      { name: 'hebrewDate', value: convertedHebrewDate },
      { name: 'gregorianDate', value: englishDate },
      { name: 'years', value: yearDuration.toString() }
    ];

    fields.forEach(field => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = field.name;
      input.value = field.value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    
    try {
      form.submit();
      
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
      }, 1000);
      
      return { success: true };
    } catch (error) {
      if (document.body.contains(form)) {
        document.body.removeChild(form);
      }
      console.error('Form submission error:', error);
      throw new Error(`Download failed: ${error.message}`);
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
      console.error('Download mutation error:', error);
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
      // If after nightfall, add one day to get the next Hebrew date
      let dateToConvert = inputDate;
      if (isAfterNightfall) {
        const date = new Date(inputDate);
        date.setDate(date.getDate() + 1);
        dateToConvert = date.toISOString().split('T')[0];
      }
      
      const [year, month, day] = dateToConvert.split('-');
      const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`);
      const data = await response.json();
      
      if (data.hebrew) {
        setConvertedHebrewDate(data.hebrew);
      }
    } catch (error) {
      console.error('Error converting date:', error);
      toast({
        title: "Error",
        description: "Failed to convert date. Please try again.",
        variant: "destructive"
      });
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
      <Dialog open={activeModal === 'date-calculator'} onOpenChange={() => closeModal()}>
        <DialogContent>
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Hebrew Date Calculator</DialogTitle>
          </div>
          <p className="text-sm text-gray-600 mb-4 text-center">Convert English dates to Hebrew dates and add recurring events to your calendar</p>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Event Title</Label>
              <Input 
                type="text" 
                placeholder="Anniversary, Yahrzeit, etc." 
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush bg-white"
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">English Date</Label>
              <Input 
                type="date" 
                value={englishDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush bg-white"
              />
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
                <Label className="block text-sm font-medium text-gray-700 mb-1">Hebrew Date</Label>
                <div className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                  {convertedHebrewDate}
                </div>
              </div>
            )}
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Add to my calendar for the next:</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setYearDuration(1)}
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
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
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
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
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
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
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0 hover:shadow-lg transition-all duration-300"
              >
                {downloadCalendarMutation.isPending ? "Generating..." : "Download Calendar"}
              </Button>
              <Button 
                onClick={() => {
                  closeModal();
                  // Navigate to home and scroll to progress (except for life page modals)
                  window.location.hash = '#/?section=home&scrollToProgress=true';
                }} 
                variant="outline"
                className="w-full rounded-xl border-blush/20 text-warm-gray hover:bg-white/90 transition-all duration-300 bg-white/70 backdrop-blur-sm border"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}