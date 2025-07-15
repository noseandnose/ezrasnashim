import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus } from "lucide-react";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useAnalytics } from "@/hooks/use-analytics";

interface BirkatHamazonPrayer {
  id: number;
  prayerType: string;
  hebrewText: string;
  englishTranslation: string;
  orderIndex: number;
}

export function BirkatHamazonModal() {
  const { activeModal, closeModal } = useModalStore();
  const [language, setLanguage] = useState<"hebrew" | "english">("hebrew");
  const [fontSize, setFontSize] = useState(20);
  const { markTefillaComplete } = useDailyCompletionStore();
  const { trackCompletion } = useAnalytics();

  const isOpen = activeModal === 'birkat-hamazon';

  const { data: prayers, isLoading } = useQuery<BirkatHamazonPrayer[]>({
    queryKey: ["/api/birkat-hamazon/prayers"],
    enabled: isOpen,
  });

  const handleComplete = () => {
    markTefillaComplete();
    trackCompletion("Birkat Hamazon");
    closeModal();
  };

  const increaseFontSize = () => {
    if (fontSize < 30) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const StandardModalHeader = () => (
    <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === "hebrew" ? "english" : "hebrew")}
          className="text-black border-black hover:bg-gray-100"
        >
          {language === "hebrew" ? "עברית" : "English"}
        </Button>
      </div>
      
      <div className="flex-1 text-center">
        <DialogTitle className="text-lg font-serif font-bold text-black">
          Birkat Hamazon
        </DialogTitle>
        <DialogDescription className="text-sm text-black/70">
          After Blessings
        </DialogDescription>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={decreaseFontSize}
          className="text-black border-black hover:bg-gray-100 w-8 h-8 p-0"
        >
          <Minus className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={increaseFontSize}
          className="text-black border-black hover:bg-gray-100 w-8 h-8 p-0"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={closeModal}
        className="text-black hover:bg-gray-100 w-8 h-8 p-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </DialogHeader>
  );

  const renderPrayerText = (prayer: BirkatHamazonPrayer) => {
    const text = language === "hebrew" ? prayer.hebrewText : prayer.englishTranslation;
    
    if (language === "hebrew") {
      return (
        <div 
          className="secular-one-bold text-right leading-relaxed whitespace-pre-line"
          style={{ fontSize: `${fontSize}px`, direction: 'rtl' }}
        >
          {text}
        </div>
      );
    }
    
    return (
      <div 
        className="font-serif leading-relaxed whitespace-pre-line text-left"
        style={{ fontSize: `${fontSize}px` }}
      >
        {text}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="w-full max-w-md mx-auto bg-white text-black border-2 border-black rounded-lg max-h-[90vh] overflow-hidden flex flex-col">
        <StandardModalHeader />
        
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : prayers && prayers.length > 0 ? (
            <div className="space-y-6">
              {prayers.map((prayer) => (
                <div key={prayer.id} className="space-y-3">
                  {renderPrayerText(prayer)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-black/60">No Birkat Hamazon content available</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-gray-200">
          <Button
            onClick={handleComplete}
            className="w-full bg-gradient-to-r from-rose-200 to-rose-300 hover:from-rose-300 hover:to-rose-400 text-black font-semibold"
          >
            Complete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}