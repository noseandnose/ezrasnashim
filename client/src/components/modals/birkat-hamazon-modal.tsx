import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Expand } from "lucide-react";

import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useTrackModalComplete } from "@/hooks/use-analytics";
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
      <p className="text-sm platypi-medium text-black">
        All tefilla texts courtesy of <a href={korenUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
      </p>
    </div>
  );
};

export function BirkatHamazonModal() {
  const { activeModal, closeModal } = useModalStore();
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

  const renderPrayerText = (prayer: BirkatHamazonPrayer | any, includeSelectedOptions = false) => {
    const text = language === "hebrew" ? prayer.hebrewText : prayer.englishTranslation;
    
    
    // Apply conditional processing first if conditions are available
    let processedText = text;
    if (conditions && text) {
      // For Me'ein Shalosh, include selected food options in conditions
      const extendedConditions = includeSelectedOptions ? {
        ...conditions,
        selectedFoodTypes: selectedOptions
      } : conditions;
      
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
              onClick={() => {
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
              onClick={() => {
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
            
            {/* Me'ein Shalosh Food Selection Checkboxes */}
            <div className="bg-gradient-to-r from-lavender-50 to-rose-50 rounded-2xl p-4 border border-lavender/20">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="grain"
                    checked={selectedOptions.grain}
                    onCheckedChange={(checked) => 
                      setSelectedOptions(prev => ({ ...prev, grain: !!checked }))
                    }
                    className="border-blush data-[state=checked]:bg-blush data-[state=checked]:border-blush"
                  />
                  <label 
                    htmlFor="grain" 
                    className="text-sm platypi-medium text-black cursor-pointer"
                  >
                    Grain
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wine"
                    checked={selectedOptions.wine}
                    onCheckedChange={(checked) => 
                      setSelectedOptions(prev => ({ ...prev, wine: !!checked }))
                    }
                    className="border-blush data-[state=checked]:bg-blush data-[state=checked]:border-blush"
                  />
                  <label 
                    htmlFor="wine" 
                    className="text-sm platypi-medium text-black cursor-pointer"
                  >
                    Wine
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fruit"
                    checked={selectedOptions.fruit}
                    onCheckedChange={(checked) => 
                      setSelectedOptions(prev => ({ ...prev, fruit: !!checked }))
                    }
                    className="border-blush data-[state=checked]:bg-blush data-[state=checked]:border-blush"
                  />
                  <label 
                    htmlFor="fruit" 
                    className="text-sm platypi-medium text-black cursor-pointer"
                  >
                    Fruits
                  </label>
                </div>
              </div>
            </div>
            
            {isAfterBrochasLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-gray-500">Loading prayer...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {afterBrochasPrayers?.filter(p => p.prayerName === "Me'ein Shalosh").map((prayer, index) => (
                  <div key={index} className="bg-white rounded-2xl p-4 border border-blush/10">
                    {renderPrayerText(prayer as any, true)}
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
                    : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
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
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('birkat-hamazon') ? 'Completed Today' : 'Complete'}
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
  const { data: afterBrochasPrayers = [], isLoading } = useQuery<{prayerName: string; hebrewText: string; englishTranslation: string}[]>({
    queryKey: ["/api/after-brochas/prayers"],
  });

  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
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

  const renderPrayerText = (prayer: any) => {
    const text = language === "hebrew" ? prayer.hebrewText : prayer.englishTranslation;
    let processedText = text;
    
    if (conditions && text) {
      // Include selected food options in conditions for Me'ein Shalosh
      const extendedConditions = {
        ...conditions,
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
          <div className="flex gap-8">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="grain-fullscreen"
              checked={selectedOptions.grain}
              onCheckedChange={(checked) => 
                setSelectedOptions(prev => ({ ...prev, grain: !!checked }))
              }
              className="border-blush data-[state=checked]:bg-blush data-[state=checked]:border-blush"
            />
            <label 
              htmlFor="grain-fullscreen" 
              className="text-sm platypi-medium text-black cursor-pointer"
            >
              Grain
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="wine-fullscreen"
              checked={selectedOptions.wine}
              onCheckedChange={(checked) => 
                setSelectedOptions(prev => ({ ...prev, wine: !!checked }))
              }
              className="border-blush data-[state=checked]:bg-blush data-[state=checked]:border-blush"
            />
            <label 
              htmlFor="wine-fullscreen" 
              className="text-sm platypi-medium text-black cursor-pointer"
            >
              Wine
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fruit-fullscreen"
              checked={selectedOptions.fruit}
              onCheckedChange={(checked) => 
                setSelectedOptions(prev => ({ ...prev, fruit: !!checked }))
              }
              className="border-blush data-[state=checked]:bg-blush data-[state=checked]:border-blush"
            />
            <label 
              htmlFor="fruit-fullscreen" 
              className="text-sm platypi-medium text-black cursor-pointer"
            >
              Fruits
            </label>
          </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {afterBrochasPrayers?.filter(p => p.prayerName === "Me'ein Shalosh").map((prayer, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 border border-blush/10">
            {conditions ? renderPrayerText(prayer) : (
              <div className="text-center text-gray-500">Loading prayer conditions...</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <p className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </p>
      </div>

      <Button
        onClick={isModalComplete('al-hamichiya') ? undefined : handleComplete}
        disabled={isModalComplete('al-hamichiya')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('al-hamichiya') 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete('al-hamichiya') ? 'Completed Today' : 'Complete'}
      </Button>
    </div>
  );
}

export function BirkatHamazonFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { data: prayers = [], isLoading } = useQuery<BirkatHamazonPrayer[]>({
    queryKey: ["/api/birkat-hamazon/prayers"],
  });

  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
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

  const renderPrayerText = (prayer: BirkatHamazonPrayer) => {
    const text = language === "hebrew" ? prayer.hebrewText : prayer.englishTranslation;
    let processedText = text;
    
    if (conditions && text) {
      processedText = processTefillaText(text, conditions);
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

  return (
    <div className="space-y-6">
      {prayers?.map((prayer) => (
        <div key={prayer.id} className="bg-white rounded-2xl p-6 border border-blush/10">
          {renderPrayerText(prayer)}
        </div>
      ))}
      
      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <p className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </p>
      </div>

      <Button
        onClick={isModalComplete('birkat-hamazon') ? undefined : handleComplete}
        disabled={isModalComplete('birkat-hamazon')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('birkat-hamazon') 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete('birkat-hamazon') ? 'Completed Today' : 'Complete'}
      </Button>
    </div>
  );
}