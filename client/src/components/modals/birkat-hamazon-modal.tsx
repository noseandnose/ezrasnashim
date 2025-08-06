import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus } from "lucide-react";

import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useAnalytics, useTrackModalComplete } from "@/hooks/use-analytics";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useLocationStore } from '@/hooks/use-jewish-times';
import { formatTextContent } from "@/lib/text-formatter";

interface BirkatHamazonPrayer {
  id: number;
  prayerType: string;
  hebrewText: string;
  englishTranslation: string;
  orderIndex: number;
}

// Koren Thank You Component
const KorenThankYou = () => {
  const { coordinates } = useLocationStore();
  
  // Check if user is in Israel based on coordinates
  const isInIsrael = coordinates && 
    coordinates.lat >= 29.5 && coordinates.lat <= 33.5 && 
    coordinates.lng >= 34.0 && coordinates.lng <= 36.0;
  
  const korenUrl = isInIsrael 
    ? "https://korenpub.co.il/collections/siddurim/products/koren-shalem-siddurhardcoverstandardashkenaz"
    : "https://korenpub.com/collections/siddurim/products/koren-shalem-siddur-ashkenaz-1";
  
  return (
    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
      <span className="text-sm platypi-medium text-black">
        All tefilla texts courtesy of{' '}
        <a 
          href={korenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-700"
        >
          Koren Publishers Jerusalem
        </a>
      </span>
    </div>
  );
};

export function BirkatHamazonModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const [language, setLanguage] = useState<"hebrew" | "english">("hebrew");
  const [fontSize, setFontSize] = useState(20);
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { trackCompletion } = useAnalytics();

  const isOpen = activeModal === 'after-brochas' || activeModal === 'birkat-hamazon' || activeModal === 'al-hamichiya';

  const { data: prayers, isLoading } = useQuery<BirkatHamazonPrayer[]>({
    queryKey: ["/api/birkat-hamazon/prayers"],
    enabled: activeModal === 'birkat-hamazon',
  });

  const { data: afterBrochasPrayers, isLoading: isAfterBrochasLoading } = useQuery<{prayerName: string; hebrewText: string; englishTranslation: string}[]>({
    queryKey: ["/api/after-brochas/prayers"],
    enabled: activeModal === 'after-brochas' || activeModal === 'al-hamichiya',
  });

  const handleComplete = (modalType: string) => {
    if (isModalComplete(modalType)) return;
    
    // Track modal completion and mark as completed globally
    trackModalComplete(modalType);
    markModalComplete(modalType);
    
    completeTask('tefilla');
    setShowHeartExplosion(true);
    
    setTimeout(() => {
      setShowHeartExplosion(false);
      checkAndShowCongratulations();
      closeModal();
      window.location.hash = '#/?section=home&scrollToProgress=true';
    }, 2000);
  };

  const increaseFontSize = () => {
    if (fontSize < 30) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const StandardModalHeader = () => (
    <div className="flex items-center justify-center mb-3 relative">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setLanguage(language === "hebrew" ? "english" : "hebrew")}
          variant="ghost"
          size="sm"
          className={`text-xs platypi-medium px-3 py-1 rounded-lg transition-all ${
            language === "hebrew" 
              ? 'bg-blush text-white' 
              : 'text-black/60 hover:text-black hover:bg-white/50'
          }`}
        >
          {language === "hebrew" ? 'עב' : 'EN'}
        </Button>
        
        <DialogTitle className="text-lg platypi-bold text-black">Birkat Hamazon</DialogTitle>
        
        <div className="flex items-center gap-2">
          <button
            onClick={decreaseFontSize}
            className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
          >
            <span className="text-xs platypi-medium">-</span>
          </button>
          <span className="text-xs platypi-medium text-black/70 w-6 text-center">{fontSize}</span>
          <button
            onClick={increaseFontSize}
            className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
          >
            <span className="text-xs platypi-medium">+</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrayerText = (prayer: BirkatHamazonPrayer) => {
    const text = language === "hebrew" ? prayer.hebrewText : prayer.englishTranslation;
    const formattedText = formatTextContent(text);
    
    if (language === "hebrew") {
      return (
        <div 
          className="secular-one-bold text-right leading-relaxed"
          style={{ fontSize: `${fontSize}px`, direction: 'rtl' }}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    }
    
    return (
      <div 
        className="platypi-regular leading-relaxed text-left"
        style={{ fontSize: `${fontSize}px` }}
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  };

  // Show After Brochas selection modal
  if (activeModal === 'after-brochas') {
    return (
      <Dialog open={true} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 platypi-regular">
          <DialogHeader className="text-center mb-4 pr-8">
            <DialogTitle className="text-lg platypi-bold text-black">After Brochas</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 platypi-regular">Prayers of Thanks</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <button
              onClick={() => openModal('al-hamichiya', 'tefilla')}
              className="w-full bg-white rounded-xl p-4 border border-blush/10 hover:bg-blush/5 transition-colors text-left"
            >
              <h3 className="platypi-medium text-black mb-1">Me'ein Shalosh</h3>
              <p className="text-sm text-gray-600">Al HaMichiya/HaGafen/HaEtz</p>
            </button>

            <button
              onClick={() => openModal('birkat-hamazon', 'tefilla')}
              className="w-full bg-white rounded-xl p-4 border border-blush/10 hover:bg-blush/5 transition-colors text-left"
            >
              <h3 className="platypi-medium text-black mb-1">Birkat Hamazon</h3>
              <p className="text-sm text-gray-600">After bread meals</p>
            </button>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button 
              onClick={() => closeModal()} 
              variant="outline"
              className="flex-1 rounded-2xl border-blush/30 text-blush hover:bg-blush/5"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show individual prayer modals
  return (
    <>
      {/* Al Hamichiya Modal */}
      <Dialog open={activeModal === 'al-hamichiya'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
          <StandardModalHeader />
          
          <div className="max-h-[60vh] overflow-y-auto">
            {isAfterBrochasLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-gray-500">Loading prayer...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {afterBrochasPrayers?.filter(p => p.prayerName === "Al Hamichiya").map((prayer, index) => (
                  <div key={index} className="bg-white rounded-2xl p-4 border border-blush/10">
                    <div 
                      className={`text-black leading-relaxed ${
                        language === "hebrew" ? "text-right heebo-regular" : "text-left platypi-regular"
                      }`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {language === "hebrew" ? prayer.hebrewText : prayer.englishTranslation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <KorenThankYou />

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('al-hamichiya') ? undefined : () => handleComplete('al-hamichiya')}
              disabled={isModalComplete('al-hamichiya')}
              className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                isModalComplete('al-hamichiya') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
              }`}
            >
              {isModalComplete('al-hamichiya') ? 'Completed Today' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showHeartExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Birkat Hamazon Modal */}
      <Dialog open={activeModal === 'birkat-hamazon'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
          <StandardModalHeader />
          
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-gray-500">Loading prayers...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {prayers?.map((prayer) => (
                  <div key={prayer.id} className="bg-white rounded-2xl p-4 border border-blush/10">
                    <div 
                      className={`text-black leading-relaxed ${
                        language === "hebrew" ? "text-right heebo-regular" : "text-left platypi-regular"
                      }`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {language === "hebrew" ? prayer.hebrewText : prayer.englishTranslation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <KorenThankYou />

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('birkat-hamazon') ? undefined : () => handleComplete('birkat-hamazon')}
              disabled={isModalComplete('birkat-hamazon')}
              className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                isModalComplete('birkat-hamazon') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
              }`}
            >
              {isModalComplete('birkat-hamazon') ? 'Completed Today' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showHeartExplosion} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}