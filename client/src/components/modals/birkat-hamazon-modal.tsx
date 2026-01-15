import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";

import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useLocationStore } from '@/hooks/use-jewish-times';
import { formatTextContent } from "@/lib/text-formatter";
import { processTefillaText, getCurrentTefillaConditions, type TefillaConditions } from '@/utils/tefilla-processor';
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { AttributionSection } from "@/components/ui/attribution-section";

// Using Brocha type from brochas table (id=2 is Birkat Hamazon)
interface Brocha {
  id: number;
  title: string;
  hebrewText: string | null;
  englishText: string | null;
  description: string | null;
  specialOccasions: boolean | null;
  orderIndex: number | null;
}

// Helper to get Koren URL based on location
const useKorenUrl = () => {
  const { coordinates } = useLocationStore();
  const isInIsrael = coordinates && 
    coordinates.lat >= 29.5 && coordinates.lat <= 33.5 && 
    coordinates.lng >= 34.0 && coordinates.lng <= 36.0;
  
  return isInIsrael 
    ? "https://korenpub.co.il/collections/siddurim/products/koren-shalem-siddurhardcoverstandardashkenaz"
    : "https://korenpub.com/collections/siddurim/products/koren-shalem-siddur-ashkenaz-1";
};

// Koren Thank You Component using AttributionSection
const KorenThankYou = () => {
  const korenUrl = useKorenUrl();
  
  return (
    <AttributionSection
      label="All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy"
      logoUrl="https://res.cloudinary.com/dsqq7a7ab/image/upload/v1764147872/1_gbfqps.png"
      aboutText="Koren Publishers Jerusalem is the leading publisher of Jewish religious texts, known for its beautiful typography and scholarly editions. Founded by Eliyahu Koren, the company has set the standard for Hebrew-language religious publishing with its distinctive Koren typeface and acclaimed editions of the Siddur, Tanakh, and Talmud."
      websiteUrl={korenUrl}
      websiteLabel="Visit Koren Publishers"
    />
  );
};

export function BirkatHamazonModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const [language, setLanguage] = useState<"hebrew" | "english">("hebrew");
  const [fontSize, setFontSize] = useState(20);
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);

  const [conditions, setConditions] = useState<TefillaConditions | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Me'ein Shalosh checkbox states
  const [selectedOptions, setSelectedOptions] = useState({
    grain: false,
    wine: false,
    fruit: false
  });
  
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();

  const { coordinates } = useLocationStore();

  // Fullscreen state
  const [fullscreenContent, setFullscreenContent] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode | ((params: { language: 'hebrew' | 'english', fontSize: number }) => React.ReactNode);
    contentType?: string;
  }>({ isOpen: false, title: '', content: null });

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
          isChanuka: false,
          isPurim: false,
          isRoshChodeshSpecial: false,
          isSunday: false,
          isMonday: false,
          isTuesday: false,
          isWednesday: false,
          isThursday: false,
          isFriday: false,
          isSaturday: false,
          isMH: false,
          isMT: false,
          isTBI: false,
          isTTI: false,
          isTTC: false,
          isTBC: false
        });
      }
    };

    loadConditions();
  }, [coordinates]);

  const { data: birkatHamazon, isLoading } = useQuery<Brocha>({
    queryKey: ["/api/brochas", 2],
    enabled: activeModal === 'birkat-hamazon',
  });

  // Me'ein Shalosh from brochas table (id=1)
  const { data: meeinShalosh, isLoading: isMeeinShaloshLoading } = useQuery<Brocha>({
    queryKey: ["/api/brochas", 1],
    enabled: activeModal === 'after-brochas' || activeModal === 'al-hamichiya',
  });

  const handleComplete = (modalType: string) => {
    // Track modal completion and mark as completed globally
    // (always track for repeatable prayers to count multiple completions)
    trackModalComplete(modalType);
    markModalComplete(modalType);
    
    completeTask('tefilla');
    setShowHeartExplosion(true);
    
    setTimeout(() => {
      setShowHeartExplosion(false);
      // Only close and navigate if congratulations modal wasn't triggered
      if (!checkAndShowCongratulations()) {
        closeModal();
        window.location.hash = '#/?section=home&scrollToProgress=true';
      } else {
        openModal('congratulations', 'tefilla');
      }
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
          onPointerDown={() => setIsFullscreen(!isFullscreen)}
          className="w-8 h-8 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
        >
          <Expand className="w-4 h-4" />
        </button>
        
        <DialogTitle className="text-lg platypi-bold text-black flex-1 text-center">
          {activeModal === 'al-hamichiya' ? 'Me\'ein Shalosh' : 'Birkat Hamazon'}
        </DialogTitle>
        
        <Button
          onPointerDown={() => setLanguage(language === "hebrew" ? "english" : "hebrew")}
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
            onPointerDown={decreaseFontSize}
            className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
          >
            <span className="text-xs platypi-medium">-</span>
          </button>
          <span className="text-xs platypi-medium text-black/70 w-6 text-center">{fontSize}</span>
          <button
            onPointerDown={increaseFontSize}
            className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
          >
            <span className="text-xs platypi-medium">+</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrayerText = (prayer: Brocha | any, includeSelectedOptions = false) => {
    // Support both Brocha (englishText) and afterBrochasPrayers (englishTranslation)
    const text = language === "hebrew" ? prayer.hebrewText : (prayer.englishText ?? prayer.englishTranslation);
    
    // Default conditions to use when conditions haven't loaded yet
    // This ensures conditional markup is still processed (all conditions default to false)
    const defaultConditions: TefillaConditions = {
      isInIsrael: false,
      isRoshChodesh: false,
      isFastDay: false,
      isAseretYemeiTeshuva: false,
      isSukkot: false,
      isPesach: false,
      isChanuka: false,
      isPurim: false,
      isRoshChodeshSpecial: false,
      isSunday: false,
      isMonday: false,
      isTuesday: false,
      isWednesday: false,
      isThursday: false,
      isFriday: false,
      isSaturday: false,
      isMH: false,
      isMT: false,
      isTBI: false,
      isTTI: false,
      isTTC: false,
      isTBC: false
    };
    
    const effectiveConditions = conditions || defaultConditions;
    
    // Apply conditional processing first
    let processedText = text;
    if (text) {
      // For Me'ein Shalosh, include selected food options in conditions
      const extendedConditions = includeSelectedOptions ? {
        ...effectiveConditions,
        selectedFoodTypes: selectedOptions
      } : effectiveConditions;
      
      processedText = processTefillaText(text, extendedConditions);
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
              onPointerDown={() => {
                // Open Me'ein Shalosh directly in fullscreen
                setFullscreenContent({
                  isOpen: true,
                  title: 'Me\'ein Shalosh',
                  contentType: 'me-ein-shalosh',
                  content: ({ language: currentLang, fontSize: currentFontSize }: { language: 'hebrew' | 'english', fontSize: number }) => 
                    <MeeinShaloshFullscreenContent language={currentLang} fontSize={currentFontSize} />
                });
                closeModal(); // Close the After Brochas selection modal
              }}
              className="w-full bg-white rounded-xl p-4 border border-blush/10 hover:bg-blush/5 transition-colors text-left"
            >
              <h3 className="platypi-medium text-black mb-1">Me'ein Shalosh</h3>
              <p className="text-sm text-gray-600">Al HaMichiya/HaGafen/HaEtz</p>
            </button>

            <button
              onPointerDown={() => {
                // Open Birkat Hamazon directly in fullscreen
                setFullscreenContent({
                  isOpen: true,
                  title: 'Birkat Hamazon',
                  contentType: 'birkat-hamazon',
                  content: ({ language: currentLang, fontSize: currentFontSize }: { language: 'hebrew' | 'english', fontSize: number }) => 
                    <BirkatHamazonFullscreenContent language={currentLang} fontSize={currentFontSize} />
                });
                closeModal(); // Close the After Brochas selection modal
              }}
              className="w-full bg-white rounded-xl p-4 border border-blush/10 hover:bg-blush/5 transition-colors text-left"
            >
              <h3 className="platypi-medium text-black mb-1">Birkat Hamazon</h3>
              <p className="text-sm text-gray-600">After bread meals</p>
            </button>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button 
              onPointerDown={() => closeModal()} 
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
            
            {/* Me'ein Shalosh Food Selection Checkboxes */}
            <div className="bg-gradient-to-r from-lavender-50 to-rose-50 rounded-2xl p-4 border border-lavender/20">
              <div className="flex justify-center">
                <div className="flex gap-6">
                  <button
                    type="button"
                    onPointerDown={() => setSelectedOptions(prev => ({ ...prev, grain: !prev.grain }))}
                    className="flex items-center gap-2"
                  >
                    <span 
                      className={`inline-flex items-center justify-center rounded-full border-2 transition-colors ${
                        selectedOptions.grain 
                          ? 'bg-blush border-blush' 
                          : 'bg-white border-gray-400'
                      }`}
                      style={{ width: '22px', height: '22px' }}
                    >
                      {selectedOptions.grain && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm platypi-medium text-black">Grains</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setSelectedOptions(prev => ({ ...prev, wine: !prev.wine }))}
                    className="flex items-center gap-2"
                  >
                    <span 
                      className={`inline-flex items-center justify-center rounded-full border-2 transition-colors ${
                        selectedOptions.wine 
                          ? 'bg-blush border-blush' 
                          : 'bg-white border-gray-400'
                      }`}
                      style={{ width: '22px', height: '22px' }}
                    >
                      {selectedOptions.wine && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm platypi-medium text-black">Wine</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setSelectedOptions(prev => ({ ...prev, fruit: !prev.fruit }))}
                    className="flex items-center gap-2"
                  >
                    <span 
                      className={`inline-flex items-center justify-center rounded-full border-2 transition-colors ${
                        selectedOptions.fruit 
                          ? 'bg-blush border-blush' 
                          : 'bg-white border-gray-400'
                      }`}
                      style={{ width: '22px', height: '22px' }}
                    >
                      {selectedOptions.fruit && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm platypi-medium text-black">Fruits</span>
                  </button>
                </div>
              </div>
            </div>
            
            {isMeeinShaloshLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-gray-500">Loading prayer...</span>
              </div>
            ) : meeinShalosh ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-4 border border-blush/10">
                  {renderPrayerText(meeinShalosh, true)}
                </div>
              </div>
            ) : null}
            
            <KorenThankYou />
            
            <div className="heart-explosion-container">
              <Button 
                onPointerDown={isModalComplete('al-hamichiya') ? undefined : () => handleComplete('al-hamichiya')}
                disabled={isModalComplete('al-hamichiya')}
                className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                  isModalComplete('al-hamichiya') 
                    ? 'bg-sage text-white' 
                    : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
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
            {isMeeinShaloshLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-gray-500">Loading prayer...</span>
              </div>
            ) : meeinShalosh ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-4 border border-blush/10">
                  {renderPrayerText(meeinShalosh)}
                </div>
              </div>
            ) : null}
          </div>

          <KorenThankYou />

          <div className="heart-explosion-container">
            <Button 
              onPointerDown={isModalComplete('al-hamichiya') ? undefined : () => handleComplete('al-hamichiya')}
              disabled={isModalComplete('al-hamichiya')}
              className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                isModalComplete('al-hamichiya') 
                  ? 'bg-sage text-white' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
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
            ) : birkatHamazon ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-4 border border-blush/10">
                  {renderPrayerText(birkatHamazon)}
                </div>
              </div>
            ) : null}
            
            <KorenThankYou />
            
            <div className="heart-explosion-container">
              <Button 
                onPointerDown={() => handleComplete('birkat-hamazon')}
                className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                  isModalComplete('birkat-hamazon') 
                    ? 'bg-sage text-white hover:scale-105 transition-transform' 
                    : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                }`}
              >
                {isModalComplete('birkat-hamazon') ? 'Complete Again' : 'Complete'}
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
              ) : birkatHamazon ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-4 border border-blush/10">
                    {renderPrayerText(birkatHamazon)}
                  </div>
                </div>
              ) : null}
            </div>

          <KorenThankYou />

          <div className="heart-explosion-container">
            <Button 
              onPointerDown={() => handleComplete('birkat-hamazon')}
              className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                isModalComplete('birkat-hamazon') 
                  ? 'bg-sage text-white hover:scale-105 transition-transform' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('birkat-hamazon') ? 'Complete Again' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showHeartExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      )}
    
    {/* Fullscreen Modal for Direct Access */}
    {fullscreenContent.isOpen && (
      <FullscreenModal
        isOpen={true}
        onClose={() => setFullscreenContent({ isOpen: false, title: '', content: null })}
        title={fullscreenContent.title}
        showFontControls={true}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        showLanguageControls={true}
        language={language}
        onLanguageChange={setLanguage}
      >
        {typeof fullscreenContent.content === 'function' 
          ? fullscreenContent.content({ language, fontSize })
          : fullscreenContent.content
        }
      </FullscreenModal>
    )}
    </>
  );
}

// Fullscreen content components
export function MeeinShaloshFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  // Me'ein Shalosh from brochas table (id=1)
  const { data: meeinShalosh, isLoading } = useQuery<Brocha>({
    queryKey: ["/api/brochas", 1],
  });

  const { completeTask } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { coordinates } = useLocationStore();
  const [conditions, setConditions] = useState<TefillaConditions | null>(null);

  // Me'ein Shalosh checkbox states
  const [selectedOptions, setSelectedOptions] = useState({
    grain: false,
    wine: false,
    fruit: false
  });

  // Load conditions for processing
  useEffect(() => {
    const loadConditions = async () => {
      try {
        const tefillaConditions = await getCurrentTefillaConditions(coordinates?.lat, coordinates?.lng);
        setConditions(tefillaConditions);
      } catch (error) {
        setConditions({
          isInIsrael: false,
          isRoshChodesh: false,
          isFastDay: false,
          isAseretYemeiTeshuva: false,
          isSukkot: false,
          isPesach: false,
          isChanuka: false,
          isPurim: false,
          isRoshChodeshSpecial: false,
          isSunday: false,
          isMonday: false,
          isTuesday: false,
          isWednesday: false,
          isThursday: false,
          isFriday: false,
          isSaturday: false,
          isMH: false,
          isMT: false,
          isTBI: false,
          isTTI: false,
          isTTC: false,
          isTBC: false
        });
      }
    };
    loadConditions();
  }, [coordinates]);

  const renderPrayerText = (prayer: Brocha) => {
    const text = language === "hebrew" ? prayer.hebrewText : prayer.englishText;
    
    // Default conditions to use when conditions haven't loaded yet
    const defaultConditions: TefillaConditions = {
      isInIsrael: false,
      isRoshChodesh: false,
      isFastDay: false,
      isAseretYemeiTeshuva: false,
      isSukkot: false,
      isPesach: false,
      isChanuka: false,
      isPurim: false,
      isRoshChodeshSpecial: false,
      isSunday: false,
      isMonday: false,
      isTuesday: false,
      isWednesday: false,
      isThursday: false,
      isFriday: false,
      isSaturday: false,
      isMH: false,
      isMT: false,
      isTBI: false,
      isTTI: false,
      isTTC: false,
      isTBC: false
    };
    
    const effectiveConditions = conditions || defaultConditions;
    let processedText = text;
    
    if (text) {
      // Include selected food options in conditions for Me'ein Shalosh
      const extendedConditions = {
        ...effectiveConditions,
        selectedFoodTypes: selectedOptions
      };
      
      processedText = processTefillaText(text, extendedConditions);
    }
    
    const formattedText = formatTextContent(processedText);
    
    if (language === "hebrew") {
      return (
        <div 
          className="vc-koren-hebrew leading-relaxed"
          style={{ fontSize: `${fontSize + 1}px` }}
          dangerouslySetInnerHTML={{ __html: formattedText.replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
        />
      );
    }
    
    return (
      <div 
        className="koren-siddur-english leading-relaxed text-left"
        style={{ fontSize: `${fontSize}px` }}
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  };

  const handleComplete = () => {
    trackModalComplete('al-hamichiya');
    markModalComplete('al-hamichiya');
    completeTask('tefilla');
    // Close fullscreen and navigate home
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
    // Small delay to ensure fullscreen closes, then navigate to home
    setTimeout(() => {
      window.location.hash = '#/?section=home&scrollToProgress=true';
    }, 100);
  };

  if (isLoading) return <div className="text-center py-8">Loading prayer...</div>;

  return (
    <div className="space-y-4">
      {/* Me'ein Shalosh Food Selection Checkboxes */}
      <div className="bg-gradient-to-r from-lavender-50 to-rose-50 rounded-2xl p-4 border border-lavender/20" style={{ animation: 'gentle-glow-pink-thin 3s ease-in-out infinite' }}>
        <div className="flex justify-center">
          <div className="flex gap-6">
            <button
              type="button"
              onPointerDown={() => setSelectedOptions(prev => ({ ...prev, grain: !prev.grain }))}
              className="flex items-center gap-2"
            >
              <span 
                className={`inline-flex items-center justify-center rounded-full border-2 transition-colors ${
                  selectedOptions.grain 
                    ? 'bg-blush border-blush' 
                    : 'bg-white border-gray-400'
                }`}
                style={{ width: '22px', height: '22px' }}
              >
                {selectedOptions.grain && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm platypi-medium text-black">Grains</span>
            </button>
            <button
              type="button"
              onPointerDown={() => setSelectedOptions(prev => ({ ...prev, wine: !prev.wine }))}
              className="flex items-center gap-2"
            >
              <span 
                className={`inline-flex items-center justify-center rounded-full border-2 transition-colors ${
                  selectedOptions.wine 
                    ? 'bg-blush border-blush' 
                    : 'bg-white border-gray-400'
                }`}
                style={{ width: '22px', height: '22px' }}
              >
                {selectedOptions.wine && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm platypi-medium text-black">Wine</span>
            </button>
            <button
              type="button"
              onPointerDown={() => setSelectedOptions(prev => ({ ...prev, fruit: !prev.fruit }))}
              className="flex items-center gap-2"
            >
              <span 
                className={`inline-flex items-center justify-center rounded-full border-2 transition-colors ${
                  selectedOptions.fruit 
                    ? 'bg-blush border-blush' 
                    : 'bg-white border-gray-400'
                }`}
                style={{ width: '22px', height: '22px' }}
              >
                {selectedOptions.fruit && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm platypi-medium text-black">Fruits</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {meeinShalosh && (
          <div className="bg-white rounded-2xl p-6 border border-blush/10">
            {conditions ? renderPrayerText(meeinShalosh) : (
              <div className="text-center text-gray-500">Loading prayer conditions...</div>
            )}
          </div>
        )}
      </div>
      
      <KorenThankYou />

      <Button
        onPointerDown={isModalComplete('al-hamichiya') ? undefined : handleComplete}
        disabled={isModalComplete('al-hamichiya')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('al-hamichiya') 
            ? 'bg-sage text-white' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete('al-hamichiya') ? 'Completed Today' : 'Complete'}
      </Button>
    </div>
  );
}

export function BirkatHamazonFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { data: birkatHamazon, isLoading } = useQuery<Brocha>({
    queryKey: ["/api/brochas", 2],
  });

  const { completeTask } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { coordinates } = useLocationStore();
  const [conditions, setConditions] = useState<TefillaConditions | null>(null);

  // Load conditions for processing
  useEffect(() => {
    const loadConditions = async () => {
      try {
        const tefillaConditions = await getCurrentTefillaConditions(coordinates?.lat, coordinates?.lng);
        setConditions(tefillaConditions);
      } catch (error) {
        setConditions({
          isInIsrael: false,
          isRoshChodesh: false,
          isFastDay: false,
          isAseretYemeiTeshuva: false,
          isSukkot: false,
          isPesach: false,
          isChanuka: false,
          isPurim: false,
          isRoshChodeshSpecial: false,
          isSunday: false,
          isMonday: false,
          isTuesday: false,
          isWednesday: false,
          isThursday: false,
          isFriday: false,
          isSaturday: false,
          isMH: false,
          isMT: false,
          isTBI: false,
          isTTI: false,
          isTTC: false,
          isTBC: false
        });
      }
    };
    loadConditions();
  }, [coordinates]);

  const renderPrayerText = (prayer: Brocha) => {
    const text = language === "hebrew" ? prayer.hebrewText : prayer.englishText;
    
    // Default conditions to use when conditions haven't loaded yet
    const defaultConditions: TefillaConditions = {
      isInIsrael: false,
      isRoshChodesh: false,
      isFastDay: false,
      isAseretYemeiTeshuva: false,
      isSukkot: false,
      isPesach: false,
      isChanuka: false,
      isPurim: false,
      isRoshChodeshSpecial: false,
      isSunday: false,
      isMonday: false,
      isTuesday: false,
      isWednesday: false,
      isThursday: false,
      isFriday: false,
      isSaturday: false,
      isMH: false,
      isMT: false,
      isTBI: false,
      isTTI: false,
      isTTC: false,
      isTBC: false
    };
    
    const effectiveConditions = conditions || defaultConditions;
    let processedText = text;
    
    if (text) {
      processedText = processTefillaText(text, effectiveConditions);
    }
    
    const formattedText = formatTextContent(processedText);
    
    if (language === "hebrew") {
      return (
        <div 
          className="vc-koren-hebrew leading-relaxed"
          style={{ fontSize: `${fontSize + 1}px` }}
          dangerouslySetInnerHTML={{ __html: formattedText.replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
        />
      );
    }
    
    return (
      <div 
        className="koren-siddur-english leading-relaxed text-left"
        style={{ fontSize: `${fontSize}px` }}
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  };

  const handleComplete = () => {
    trackModalComplete('birkat-hamazon');
    markModalComplete('birkat-hamazon');
    completeTask('tefilla');
    // Close fullscreen and navigate home
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
    // Small delay to ensure fullscreen closes, then navigate to home
    setTimeout(() => {
      window.location.hash = '#/?section=home&scrollToProgress=true';
    }, 100);
  };

  if (isLoading) return <div className="text-center py-8">Loading prayers...</div>;
  if (!birkatHamazon) return <div className="text-center py-8">Prayer not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-blush/10">
        {renderPrayerText(birkatHamazon)}
      </div>
      
      <KorenThankYou />

      <Button
        onPointerDown={handleComplete}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('birkat-hamazon') 
            ? 'bg-sage text-white hover:scale-105 transition-transform' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete('birkat-hamazon') ? 'Complete Again' : 'Complete'}
      </Button>
    </div>
  );
}