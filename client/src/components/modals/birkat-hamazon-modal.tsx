import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, Expand } from "lucide-react";

import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useAnalytics, useTrackModalComplete } from "@/hooks/use-analytics";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useLocationStore } from '@/hooks/use-jewish-times';
import { formatTextContent } from "@/lib/text-formatter";
import { processTefillaText, getCurrentTefillaConditions, type TefillaConditions } from '@/utils/tefilla-processor';
import { FullscreenModal } from "@/components/ui/fullscreen-modal";

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
        {' '}and Rabbi Sacks Legacy
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
  const [conditions, setConditions] = useState<TefillaConditions | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { trackCompletion } = useAnalytics();
  const { coordinates } = useLocationStore();

  const isOpen = activeModal === 'after-brochas' || activeModal === 'birkat-hamazon' || activeModal === 'al-hamichiya';

  // Ensure fonts are loaded before showing content
  useEffect(() => {
    const checkFonts = async () => {
      try {
        // Wait for fonts to load
        await document.fonts.load('normal 1em "Koren Siddur"');
        await document.fonts.load('normal 1em "Arno Koren"');
        setFontsLoaded(true);
      } catch (error) {
        // Fallback after 500ms if font loading fails
        setTimeout(() => setFontsLoaded(true), 500);
      }
    };
    
    if (isOpen) {
      checkFonts();
    }
  }, [isOpen]);

  // Load Tefilla conditions for conditional content processing
  useEffect(() => {
    const loadConditions = async () => {
      try {
        const tefillaConditions = await getCurrentTefillaConditions(
          coordinates?.lat,
          coordinates?.lng
        );
        setConditions(tefillaConditions);
      } catch (error) {
        // Could not load Tefilla conditions - Set default conditions
        setConditions({
          isInIsrael: false,
          isRoshChodesh: false,
          isFastDay: false,
          isAseretYemeiTeshuva: false,
          isSukkot: false,
          isPesach: false,
          isRoshChodeshSpecial: false
        });
      }
    };

    loadConditions();
  }, [coordinates]);

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
    <div className="mb-2 space-y-2">
      {/* First Row: Fullscreen, Title, and Language Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-8 h-8 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
        >
          <Expand className="w-4 h-4" />
        </button>
        
        <DialogTitle className="text-lg platypi-bold text-black flex-1 text-center">
          {activeModal === 'al-hamichiya' ? 'Me\'ein Shalosh' : 'Birkat Hamazon'}
        </DialogTitle>
        
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
      </div>
      
      {/* Second Row: Font Size Controls */}
      <div className="flex items-center justify-center">
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

  const renderPrayerText = (prayer: BirkatHamazonPrayer | any) => {
    const text = language === "hebrew" ? prayer.hebrewText : prayer.englishTranslation;
    
    // Apply conditional processing first if conditions are available
    let processedText = text;
    if (conditions && text) {
      processedText = processTefillaText(text, conditions);
    }
    
    // Apply text formatting to handle ** and ---
    const formattedText = formatTextContent(processedText);
    
    // Show loading state if fonts aren't loaded yet
    if (!fontsLoaded) {
      return (
        <div className="flex justify-center py-4">
          <div className="text-sm text-gray-500">Loading prayer...</div>
        </div>
      );
    }
    
    if (language === "hebrew") {
      return (
        <div 
          className="vc-koren-hebrew leading-relaxed"
          style={{ 
            fontSize: `${fontSize + 1}px`,
            visibility: fontsLoaded ? 'visible' : 'hidden'
          }}
          dangerouslySetInnerHTML={{ __html: formattedText.replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
        />
      );
    }
    
    return (
      <div 
        className="koren-siddur-english leading-relaxed text-left"
        style={{ 
          fontSize: `${fontSize}px`,
          visibility: fontsLoaded ? 'visible' : 'hidden'
        }}
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
      {isFullscreen ? (
        <FullscreenModal
          isOpen={activeModal === 'al-hamichiya'}
          onClose={() => {
            setIsFullscreen(false);
            closeModal(true);
          }}
          title="Me'ein Shalosh"
          showFontControls={true}
          fontSize={fontSize}
          onFontSizeChange={(size) => setFontSize(size)}
          showLanguageControls={true}
          language={language}
          onLanguageChange={setLanguage}
        >
          <div className="space-y-4">
            
            {isAfterBrochasLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-gray-500">Loading prayer...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {afterBrochasPrayers?.filter(p => p.prayerName === "Me'ein Shalosh").map((prayer, index) => (
                  <div key={index} className="bg-white rounded-2xl p-4 border border-blush/10">
                    {renderPrayerText(prayer as any)}
                  </div>
                ))}
              </div>
            )}
            
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
          </div>
        </FullscreenModal>
      ) : (
        <Dialog open={activeModal === 'al-hamichiya'} onOpenChange={() => closeModal(true)}>
          <DialogContent className="dialog-content w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
            <StandardModalHeader />
            
            <div className="max-h-[60vh] overflow-y-auto">
            {isAfterBrochasLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-gray-500">Loading prayer...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {afterBrochasPrayers?.filter(p => p.prayerName === "Me'ein Shalosh").map((prayer, index) => (
                  <div key={index} className="bg-white rounded-2xl p-4 border border-blush/10">
                    {renderPrayerText(prayer as any)}
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
      )}

      {/* Birkat Hamazon Modal */}
      {isFullscreen ? (
        <FullscreenModal
          isOpen={activeModal === 'birkat-hamazon'}
          onClose={() => {
            setIsFullscreen(false);
            closeModal(true);
          }}
          title="Birkat Hamazon"
          showFontControls={true}
          fontSize={fontSize}
          onFontSizeChange={(size) => setFontSize(size)}
          showLanguageControls={true}
          language={language}
          onLanguageChange={setLanguage}
        >
          <div className="space-y-4">
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-gray-500">Loading prayers...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {prayers?.map((prayer) => (
                  <div key={prayer.id} className="bg-white rounded-2xl p-4 border border-blush/10">
                    {renderPrayerText(prayer)}
                  </div>
                ))}
              </div>
            )}
            
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
          </div>
        </FullscreenModal>
      ) : (
        <Dialog open={activeModal === 'birkat-hamazon'} onOpenChange={() => closeModal(true)}>
          <DialogContent className="dialog-content w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
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
                      {renderPrayerText(prayer)}
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
      )}
    </>
  );
}