import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus } from "lucide-react";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useAnalytics } from "@/hooks/use-analytics";
import { HeartExplosion } from "@/components/ui/heart-explosion";

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
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const { markTefillaComplete } = useDailyCompletionStore();
  const { trackCompletion } = useAnalytics();

  const isOpen = activeModal === 'birkat-hamazon';

  const { data: prayers, isLoading } = useQuery<BirkatHamazonPrayer[]>({
    queryKey: ["/api/birkat-hamazon/prayers"],
    enabled: isOpen,
  });

  const handleComplete = () => {
    setShowHeartExplosion(true);
    trackCompletion("Birkat Hamazon");
    
    setTimeout(() => {
      markTefillaComplete();
      closeModal();
      setShowHeartExplosion(false);
    }, 2000);
  };

  const increaseFontSize = () => {
    if (fontSize < 30) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const StandardModalHeader = () => (
    <div className="flex items-center justify-center mb-3 relative pr-8">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setLanguage(language === "hebrew" ? "english" : "hebrew")}
          variant="ghost"
          size="sm"
          className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
            language === "hebrew" 
              ? 'bg-blush text-white' 
              : 'text-black/60 hover:text-black hover:bg-white/50'
          }`}
        >
          {language === "hebrew" ? 'עב' : 'EN'}
        </Button>
        
        <DialogTitle className="text-lg font-serif font-bold text-black">Birkat Hamazon</DialogTitle>
        
        <div className="flex items-center gap-2">
          <button
            onClick={decreaseFontSize}
            className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
          >
            <span className="text-xs font-medium">-</span>
          </button>
          <span className="text-xs font-medium text-black/70 w-6 text-center">{fontSize}</span>
          <button
            onClick={increaseFontSize}
            className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
          >
            <span className="text-xs font-medium">+</span>
          </button>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={closeModal}
        className="absolute top-0 right-0 text-black hover:bg-gray-100 w-8 h-8 p-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
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
        <DialogHeader>
          <StandardModalHeader />
        </DialogHeader>
        
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
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0"
          >
            Completed
          </Button>
        </div>
        
        <HeartExplosion 
          trigger={showHeartExplosion} 
          onComplete={() => setShowHeartExplosion(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}