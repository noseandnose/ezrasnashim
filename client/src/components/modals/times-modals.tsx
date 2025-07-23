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

  const downloadCalendarMutation = useMutation({
    mutationFn: async (data: { title: string; hebrewDate: string; gregorianDate: string; years: number }) => {
      console.log('Downloading calendar with data:', data);
      const response = await fetch(`/api/calendar-events/download?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Calendar download error:', errorText);
        throw new Error('Failed to generate calendar file');
      }
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_${data.years}_years.ics`;
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: `Calendar file downloaded for the next ${variables.years} year${variables.years > 1 ? 's' : ''}`
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download calendar file",
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

    downloadCalendarMutation.mutate({
      title: eventTitle,
      hebrewDate: convertedHebrewDate,
      gregorianDate: englishDate,
      years: yearDuration
    });
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
              <Label className="block text-sm font-medium text-gray-700 mb-1">Duration</Label>
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
                {downloadCalendarMutation.isPending ? "Generating..." : `Download Calendar (${yearDuration} Year${yearDuration > 1 ? 's' : ''})`}
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