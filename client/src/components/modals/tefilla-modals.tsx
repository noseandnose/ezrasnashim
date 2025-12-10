import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { HandHeart, Scroll, Heart, Plus, Minus, Stethoscope, HeartHandshake, Baby, DollarSign, Star, Users, GraduationCap, Smile, Unlock, Check, Utensils, Wine, Car, Wheat, Moon, User, Info } from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

import { MinchaPrayer, MorningPrayer, NishmasText, GlobalTehillimProgress, TehillimName, WomensPrayer } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import axiosClient from "@/lib/axiosClient";
import { useTrackModalComplete, useAnalytics } from "@/hooks/use-analytics";
import { BirkatHamazonModal, MeeinShaloshFullscreenContent, BirkatHamazonFullscreenContent } from "@/components/modals/birkat-hamazon-modal";
import { useLocationStore } from '@/hooks/use-jewish-times';
import { formatTextContent } from "@/lib/text-formatter";
import { processTefillaText, getCurrentTefillaConditions, type TefillaConditions } from "@/utils/tefilla-processor";
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { Expand } from "lucide-react";
import { AttributionSection } from "@/components/ui/attribution-section";

// Import simplified compass component
import { SimpleCompassUI } from '@/components/compass/SimpleCompassUI';

interface TefillaModalsProps {
  onSectionChange?: (section: 'torah' | 'tefilla' | 'tzedaka' | 'home' | 'table') => void;
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

const ChuppahThankYou = () => {
  return (
    <AttributionSection
      label="Thank you to Chuppah.org for providing this Tefilla"
      aboutText="Chuppah.org is a Jewish wedding resource providing prayers, blessings, and guidance for couples preparing for their special day."
      websiteUrl="https://www.chuppah.org/"
      websiteLabel="Visit Chuppah.org"
    />
  );
};

const NishmasThankYou = () => {
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

// Custom hook to manage Tefilla conditions
const useTefillaConditions = () => {
  const { coordinates } = useLocationStore();
  const [conditions, setConditions] = useState<TefillaConditions | null>(null);

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
          // New seasonal conditions
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

  return conditions;
};

// Custom hook for Maariv - checks tomorrow for Rosh Chodesh since Jewish days start at sunset
const useMaarivTefillaConditions = () => {
  const { coordinates } = useLocationStore();
  const [conditions, setConditions] = useState<TefillaConditions | null>(null);

  useEffect(() => {
    const loadConditions = async () => {
      try {
        const tefillaConditions = await getCurrentTefillaConditions(
          coordinates?.lat,
          coordinates?.lng,
          true // Check tomorrow for Rosh Chodesh for Maariv
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
          // New seasonal conditions
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

  return conditions;
};

// Enhanced text processing function for Tefilla content
const processTefillaContent = (text: string, conditions: TefillaConditions | null): string => {
  if (!text) return text;
  
  // If conditions are not loaded yet, use default conditions (all false) to ensure conditional markup is still processed
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
    // New seasonal conditions
    isMH: false,
    isMT: false,
    isTBI: false,
    isTTI: false,
    isTTC: false,
    isTBC: false
  };
  
  const effectiveConditions = conditions || defaultConditions;
  
  // Process conditional text FIRST (removes/shows conditional sections)
  const processedText = processTefillaText(text, effectiveConditions);
  
  // Then format the resulting text (bold, italics, etc)
  return formatTextContent(processedText);
};

// Helper functions for prayer reason icons and short text
const getReasonIcon = (reason: string, reasonEnglish?: string) => {
  // Map Hebrew reasons and English translations to icons
  const reasonToCode = (r: string, eng?: string): string => {
    // Handle both Hebrew and English reasons, plus common variations
    if (r === "רפואה שלמה" || eng === "Complete Healing" || r === "health" || eng === "health" || r === "Health") return "health";
    if (r === "שידוך" || eng === "Finding a mate" || r === "shidduch" || eng === "shidduch") return "shidduch";
    if (r === "זרע של קיימא" || eng === "Children" || r === "children" || eng === "children") return "children";
    if (r === "פרנסה" || eng === "Livelihood" || r === "parnassa" || eng === "parnassa") return "parnassa";
    if (r === "הצלחה" || eng === "Success" || r === "success" || eng === "success") return "success";
    if (r === "שלום בית" || eng === "Family" || r === "family" || eng === "family") return "family";
    if (r === "חכמה" || eng === "Education" || r === "education" || eng === "education") return "education";
    if (r === "עליית נשמה" || eng === "Peace" || r === "peace" || eng === "peace") return "peace";
    if (r === "פדיון שבויים" || eng === "Release from Captivity" || r === "hostages" || eng === "hostages") return "hostages";
    return "general";
  };
  
  const code = reasonToCode(reason, reasonEnglish);
  const iconMap: Record<string, JSX.Element> = {
    'health': <Stethoscope size={12} className="text-red-500" />,
    'shidduch': <HeartHandshake size={12} className="text-pink-500" />,
    'children': <Baby size={12} className="text-blue-500" />,
    'parnassa': <DollarSign size={12} className="text-green-500" />,
    'success': <Star size={12} className="text-yellow-500" />,
    'family': <Users size={12} className="text-purple-500" />,
    'education': <GraduationCap size={12} className="text-indigo-500" />,
    'peace': <Smile size={12} className="text-teal-500" />,
    'hostages': <Unlock size={12} className="text-orange-600" />,
    'general': <Heart size={12} className="text-blush" />
  };
  
  return iconMap[code];
};



// Standardized Modal Header Component for Tefilla Modals
const StandardModalHeader = ({ 
  title, 
  showHebrew, 
  setShowHebrew, 
  fontSize, 
  setFontSize 
}: {
  title: string;
  showHebrew: boolean;
  setShowHebrew: (show: boolean) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}) => (
  <div className="mb-2 space-y-2">
    {/* First Row: Language Toggle and Title */}
    <div className="flex items-center justify-center gap-4">
      <Button
        onClick={() => setShowHebrew(!showHebrew)}
        variant="ghost"
        size="sm"
        className={`text-xs platypi-medium px-3 py-1 rounded-lg transition-all ${
          showHebrew 
            ? 'bg-blush text-white' 
            : 'text-black/60 hover:text-black hover:bg-white/50'
        }`}
      >
        {showHebrew ? 'EN' : 'עב'}
      </Button>
      
      <DialogTitle className="text-lg platypi-bold text-black">{title}</DialogTitle>
    </div>
    
    {/* Second Row: Font Size Controls */}
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFontSize(Math.max(12, fontSize - 2))}
          className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
        >
          <span className="text-xs platypi-medium">-</span>
        </button>
        <span className="text-xs platypi-medium text-black/70 w-6 text-center">{fontSize}</span>
        <button
          onClick={() => setFontSize(Math.min(32, fontSize + 2))}
          className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
        >
          <span className="text-xs platypi-medium">+</span>
        </button>
      </div>
    </div>
  </div>
);

// Morning Brochas Modal Component
function MorningBrochasModal({ setFullscreenContent, language, setLanguage, fontSize, setFontSize }: { 
  setFullscreenContent?: (content: any) => void; 
  language: 'hebrew' | 'english';
  setLanguage: (lang: 'hebrew' | 'english') => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}) {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [_showEnglish, _setShowEnglish] = useState(false);
  
  // Load Tefilla conditions for conditional content processing
  const tefillaConditions = useTefillaConditions();
  
  // Fetch morning prayers from database
  const { data: morningPrayers, isLoading } = useQuery({
    queryKey: ['morning-prayers'],
    queryFn: async () => {
      // Making API call for morning prayers from database
      const response = await axiosClient.get('/api/morning/prayers');
      // Response received from API
      return response.data; // Returns array of MorningPrayer objects from database
    },
    enabled: activeModal === 'morning-brochas',
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });

  // Modal state and data loaded
  
  return (
    <Dialog open={activeModal === 'morning-brochas'} onOpenChange={() => closeModal(true)}>
      <DialogContent className="dialog-content w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="morning-brochas-description">
        <div id="morning-brochas-description" className="sr-only">Daily morning blessings and prayers of gratitude</div>
        
        {/* Fullscreen button */}
        {setFullscreenContent && (
          <button
            onClick={() => {
              setFullscreenContent({
                isOpen: true,
                title: 'Morning Brochas',
                contentType: 'morning-brochas',
                content: ({ language: currentLanguage, fontSize: currentFontSize }: { language: string; fontSize: number }) => (
                  <div className="space-y-4">
                    <div className="space-y-6">
                      {morningPrayers?.map((prayer: any) => (
                        <div key={prayer.id} className="bg-white rounded-2xl p-4 border border-blush/10">
                          {currentLanguage === 'hebrew' && prayer.hebrewText && (
                            <div 
                              className="vc-koren-hebrew leading-relaxed"
                              style={{ fontSize: `${currentFontSize + 1}px` }}
                              dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.hebrewText, tefillaConditions) }}
                            />
                          )}
                          {currentLanguage === 'english' && (
                            <div 
                              className="koren-siddur-english text-left leading-relaxed text-black/70"
                              style={{ fontSize: `${currentFontSize}px` }}
                              dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.englishTranslation || "English translation not available", tefillaConditions) }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <KorenThankYou />
                    
                    <div className="heart-explosion-container">
                      <Button 
                        onClick={isModalComplete('morning-brochas') ? undefined : () => {
                          trackModalComplete('morning-brochas');
                          markModalComplete('morning-brochas');
                          completeTask('tefilla');
                          setFullscreenContent({ isOpen: false, title: '', content: null });
                          
                          // Check if all tasks are completed and show congratulations
                          if (checkAndShowCongratulations()) {
                            openModal('congratulations', 'tefilla');
                          }
                        }}
                        disabled={isModalComplete('morning-brochas')}
                        className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                          isModalComplete('morning-brochas') 
                            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                        }`}
                      >
                        {isModalComplete('morning-brochas') ? 'Completed Today' : 'Complete'}
                      </Button>
                    </div>
                  </div>
                )
              });
            }}
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Open fullscreen"
          >
            <Expand className="h-4 w-4 text-gray-600" />
          </button>
        )}
        
        {/* Standardized Header with centered controls */}
        <div className="mb-2 space-y-2">
          {/* First Row: Language Toggle, Title, and Info Icon */}
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={() => setLanguage(language === 'hebrew' ? 'english' : 'hebrew')}
              variant="ghost"
              size="sm"
              className={`text-xs platypi-medium px-3 py-1 rounded-lg transition-all ${
                language === 'hebrew' 
                  ? 'bg-blush text-white' 
                  : 'text-black/60 hover:text-black hover:bg-white/50'
              }`}
            >
              {language === 'hebrew' ? 'EN' : 'עב'}
            </Button>
            
            <DialogTitle className="text-lg platypi-bold text-black">Morning Brochas</DialogTitle>
            
            {/* Info Icon with Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="ml-1 p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <Info className="h-4 w-4 text-gray-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3">
                <p className="text-xs text-black">
                  Birchos Kriyas Shema should not be recited after Sof Zman Tfillah.
                </p>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Second Row: Font Size Controls */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
              >
                <span className="text-xs platypi-medium">-</span>
              </button>
              <span className="text-xs platypi-medium text-black/70 w-6 text-center">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
              >
                <span className="text-xs platypi-medium">+</span>
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Prayer Content Area */}
        <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {morningPrayers?.map((prayer: MorningPrayer, _index: number) => (
                <div key={prayer.id} className="space-y-3 border-b border-warm-gray/10 pb-4 last:border-b-0">
                  {prayer.hebrewText && language === 'hebrew' && (
                    <div 
                      className="vc-koren-hebrew leading-relaxed"
                      style={{ fontSize: `${fontSize + 1}px` }}
                      dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.hebrewText, tefillaConditions).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
                    />
                  )}
                  {language === 'english' && (
                    <div 
                      className="koren-siddur-english text-left leading-relaxed text-black/70"
                      style={{ fontSize: `${fontSize}px` }}
                      dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.englishTranslation || "English translation not available", tefillaConditions) }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <KorenThankYou />

        <Button 
          onClick={isModalComplete('morning-brochas') ? undefined : () => {
            // Track modal completion and mark as completed globally
            trackModalComplete('morning-brochas');
            markModalComplete('morning-brochas');
            
            completeTask('tefilla');
            setShowHeartExplosion(true);
            
            setTimeout(() => {
              setShowHeartExplosion(false); // Reset explosion state
              
              // Check if all tasks are completed and show congratulations
              if (checkAndShowCongratulations()) {
                openModal('congratulations', 'tefilla');
              } else {
                closeModal();
                window.location.hash = '#/?section=home&scrollToProgress=true';
              }
            }, 2000);
          }}
          disabled={isLoading || isModalComplete('morning-brochas')}
          className={`w-full py-3 rounded-xl platypi-medium border-0 ${
            isModalComplete('morning-brochas') 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
        >
          {isModalComplete('morning-brochas') ? 'Completed Today' : 'Complete'}
        </Button>
        
        {/* Heart Explosion Animation */}
        <HeartExplosion 
          trigger={showHeartExplosion}
          onComplete={() => setShowHeartExplosion(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}

// Helper function to render prayer content in fullscreen
function renderPrayerContent(contentType: string | undefined, language: 'hebrew' | 'english', fontSize: number) {
  if (!contentType) return null;

  switch (contentType) {
    case 'maariv':
      return <MaarivFullscreenContent language={language} fontSize={fontSize} />;
    case 'mincha':
      return <MinchaFullscreenContent language={language} fontSize={fontSize} />;
    case 'morning-brochas':
      return <MorningBrochasWithNavigation language={language} fontSize={fontSize} />;
    case 'nishmas-campaign':
      return <NishmasFullscreenContent language={language} fontSize={fontSize} />;
    case 'individual-tehillim':
      return <TehillimFullscreenContent language={language} fontSize={fontSize} />;
    case 'brochas':
      return <BrochasFullscreenContent language={language} fontSize={fontSize} />;
    case 'individual-brocha':
      return <IndividualBrochaFullscreenContent language={language} fontSize={fontSize} />;
    case 'global-tehillim':
      return <GlobalTehillimFullscreenContent language={language} fontSize={fontSize} />;
    case 'special-tehillim':
      return <SpecialTehillimFullscreenContent language={language} fontSize={fontSize} />;
    case 'me-ein-shalosh':
      return <MeeinShaloshFullscreenContent language={language} fontSize={fontSize} />;
    case 'birkat-hamazon':
      return <BirkatHamazonFullscreenContent language={language} fontSize={fontSize} />;
    case 'individual-prayer':
      return <IndividualPrayerFullscreenContent language={language} fontSize={fontSize} />;
    case 'compass':
      return <CompassFullscreenContent />;
    default:
      return null;
  }
}

// Fullscreen content components for prayers
function MaarivFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { data: prayers = [], isLoading } = useQuery<MorningPrayer[]>({
    queryKey: ['/api/maariv/prayers'],
  });

  // Use special Maariv hook that checks tomorrow for Rosh Chodesh (Jewish days start at sunset)
  const tefillaConditions = useMaarivTefillaConditions();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { openModal } = useModalStore();

  if (isLoading) return <div className="text-center py-8">Loading prayers...</div>;

  const handleComplete = () => {
    trackModalComplete('maariv');
    markModalComplete('maariv');
    completeTask('tefilla');
    
    // Check if all tasks are completed and show congratulations
    if (checkAndShowCongratulations()) {
      openModal('congratulations', 'tefilla');
    }
    
    // Close fullscreen
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6">
      {prayers.map((prayer, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 border border-blush/10">
          <div
            className={`${language === 'hebrew' ? 'vc-koren-hebrew text-right' : 'koren-siddur-english text-left'} leading-relaxed text-black`}
            style={{ fontSize: language === 'hebrew' ? `${fontSize + 1}px` : `${fontSize}px` }}
            dangerouslySetInnerHTML={{
              __html: processTefillaContent(
                language === 'hebrew' ? prayer.hebrewText : prayer.englishTranslation, 
                tefillaConditions
              )
            }}
          />
        </div>
      ))}
      
      <KorenThankYou />

      <Button
        onClick={isModalComplete('maariv') ? undefined : handleComplete}
        disabled={isModalComplete('maariv')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('maariv') 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete('maariv') ? 'Completed Today' : 'Complete'}
      </Button>
    </div>
  );
}

function MinchaFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { data: prayers = [], isLoading } = useQuery<MinchaPrayer[]>({
    queryKey: ['/api/mincha/prayers'],
  });

  const tefillaConditions = useTefillaConditions();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { openModal } = useModalStore();

  if (isLoading) return <div className="text-center py-8">Loading prayers...</div>;

  const handleComplete = () => {
    trackModalComplete('mincha');
    markModalComplete('mincha');
    completeTask('tefilla');
    
    // Check if all tasks are completed and show congratulations
    if (checkAndShowCongratulations()) {
      openModal('congratulations', 'tefilla');
    }
    
    // Close fullscreen
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6">
      {prayers.map((prayer, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 border border-blush/10">
          <div
            className={`${language === 'hebrew' ? 'vc-koren-hebrew text-right' : 'koren-siddur-english text-left'} leading-relaxed text-black`}
            style={{ fontSize: language === 'hebrew' ? `${fontSize + 1}px` : `${fontSize}px` }}
            dangerouslySetInnerHTML={{
              __html: processTefillaContent(
                language === 'hebrew' ? prayer.hebrewText : prayer.englishTranslation, 
                tefillaConditions
              )
            }}
          />
        </div>
      ))}
      
      <KorenThankYou />

      <Button
        onClick={isModalComplete('mincha') ? undefined : handleComplete}
        disabled={isModalComplete('mincha')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('mincha') 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete('mincha') ? 'Completed Today' : 'Complete'}
      </Button>
    </div>
  );
}

function IndividualBrochaFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const selectedBrochaId = (window as any).selectedBrochaId;
  const tefillaConditions = useTefillaConditions();
  const { completeTask } = useDailyCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { markModalComplete } = useModalCompletionStore();

  // Me'ein Shalosh food selection state
  const [selectedOptions, setSelectedOptions] = useState({
    grain: false,
    wine: false,
    fruit: false
  });

  // Fetch the specific brocha by ID
  const { data: brocha, isLoading } = useQuery<any>({
    queryKey: ['/api/brochas', selectedBrochaId],
    enabled: !!selectedBrochaId,
  });

  if (isLoading || !brocha) return <div className="text-center py-8">Loading brocha...</div>;

  const isMeeinShalosh = brocha.title === "Me'ein Shalosh";

  const handleComplete = () => {
    const modalId = `brocha-${brocha.id}`;
    // Track with specific brocha ID for backend analytics
    trackModalComplete(modalId);
    // Mark as complete for local flower counting (repeatables can be done multiple times)
    markModalComplete(modalId);
    completeTask('tefilla');
    // Close fullscreen
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
  };

  // Process text with food selections for Me'ein Shalosh
  const getProcessedText = (text: string) => {
    if (!text || !tefillaConditions) return text;
    
    if (isMeeinShalosh) {
      // Include selected food options in conditions for Me'ein Shalosh
      const extendedConditions = {
        ...tefillaConditions,
        selectedFoodTypes: selectedOptions
      };
      return processTefillaContent(text, extendedConditions);
    }
    
    return processTefillaContent(text, tefillaConditions);
  };

  return (
    <div className="space-y-6">
      {/* Me'ein Shalosh food selection checkboxes */}
      {isMeeinShalosh && (
        <div className="bg-blush/10 rounded-2xl p-4 border border-blush/20">
          <div className="flex justify-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="grain"
                  checked={selectedOptions.grain}
                  onCheckedChange={(checked) => 
                    setSelectedOptions(prev => ({ ...prev, grain: !!checked }))
                  }
                  className="h-3 w-3 border-2 border-gray-600 data-[state=checked]:bg-blush data-[state=checked]:border-blush [&>span>svg]:h-4 [&>span>svg]:w-4 [&>span>svg]:stroke-[4]"
                />
                <label 
                  htmlFor="grain" 
                  className="text-sm platypi-medium text-black cursor-pointer"
                >
                  Grains
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wine"
                  checked={selectedOptions.wine}
                  onCheckedChange={(checked) => 
                    setSelectedOptions(prev => ({ ...prev, wine: !!checked }))
                  }
                  className="h-3 w-3 border-2 border-gray-600 data-[state=checked]:bg-blush data-[state=checked]:border-blush [&>span>svg]:h-4 [&>span>svg]:w-4 [&>span>svg]:stroke-[4]"
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
                  className="h-3 w-3 border-2 border-gray-600 data-[state=checked]:bg-blush data-[state=checked]:border-blush [&>span>svg]:h-4 [&>span>svg]:w-4 [&>span>svg]:stroke-[4]"
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
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-blush/10">
        
        {language === 'hebrew' && brocha.hebrewText && (
          <div 
            className="vc-koren-hebrew text-right leading-relaxed text-black"
            style={{ fontSize: `${fontSize + 1}px` }}
            dangerouslySetInnerHTML={{ __html: getProcessedText(brocha.hebrewText) }}
          />
        )}
        {language === 'english' && brocha.englishText && (
          <div 
            className="koren-siddur-english text-left leading-relaxed text-black/70"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: getProcessedText(brocha.englishText || "English translation not available") }}
          />
        )}
      </div>
      
      <KorenThankYou />

      <Button
        onClick={handleComplete}
        className="w-full py-3 rounded-xl platypi-medium border-0 mt-6 bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse"
      >
        Complete Brocha
      </Button>
    </div>
  );
}

function BrochasFullscreenContent({ language: _language, fontSize: _fontSize }: { language: 'hebrew' | 'english'; fontSize: number }) {
  const [activeTab, setActiveTab] = useState<'daily' | 'special'>('daily');
  
  const { data: dailyBrochas = [], isLoading: dailyLoading } = useQuery<any[]>({
    queryKey: ['/api/brochas/daily'],
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (garbage collection time)
  });

  const { data: specialBrochas = [], isLoading: specialLoading } = useQuery<any[]>({
    queryKey: ['/api/brochas/special'],
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (garbage collection time)
  });

  // Icon mapping function for brochas
  const getBrochaIcon = (title: string) => {
    switch (title) {
      case "Me'ein Shalosh":
        return Wine; // Wine icon for Me'ein Shalosh
      case "Birkat Hamazon":
        return Utensils; // Fork and knife for Birkat Hamazon
      case "Kriyat Shmah Al Hamita":
        return Moon; // Moon for bedtime prayer
      case "Asher Yatzar":
        return User; // Simple user/lady icon
      case "Hafrashas Challah":
        return Wheat; // Wheat for challah
      case "Tefillas Haderech":
        return Car; // Car for travel prayer
      default:
        return Star; // Default star icon for any future brochas
    }
  };

  // Type the arrays properly and handle loading states
  const dailyArray = Array.isArray(dailyBrochas) ? dailyBrochas : [];
  const specialArray = Array.isArray(specialBrochas) ? specialBrochas : [];
  
  // Show content immediately if we have cached data, even while loading
  const hasData = dailyArray.length > 0 || specialArray.length > 0;
  
  if (!hasData && (dailyLoading || specialLoading)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-rose-blush/30 border-t-rose-blush rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 platypi-regular">Loading brochas...</p>
        </div>
      </div>
    );
  }

  const currentBrochas = activeTab === 'daily' ? dailyArray : specialArray;
  const hasDaily = dailyArray.length > 0;
  const hasSpecial = specialArray.length > 0;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex bg-blush/20 rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            activeTab === 'daily'
              ? 'bg-white text-black shadow-md border border-blush/30'
              : 'text-black/50 hover:text-black/70'
          }`}
        >
          Daily ({hasDaily ? dailyBrochas.length : 0})
        </button>
        <button
          onClick={() => setActiveTab('special')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            activeTab === 'special'
              ? 'bg-white text-black shadow-md border border-blush/30'
              : 'text-black/50 hover:text-black/70'
          }`}
        >
          Special ({hasSpecial ? specialBrochas.length : 0})
        </button>
      </div>

      {/* Prayer Buttons */}
      <div className="space-y-4">
        {currentBrochas.length > 0 ? (
          currentBrochas.map((brocha: any) => {
            const IconComponent = getBrochaIcon(brocha.title);
            return (
              <button
                key={brocha.id}
                onClick={() => {
                  // Store the selected brocha ID globally and open individual brocha fullscreen
                  (window as any).selectedBrochaId = brocha.id;
                  const openEvent = new CustomEvent('openDirectFullscreen', {
                    detail: {
                      title: brocha.title,
                      contentType: 'individual-brocha',
                      hasTranslation: true
                    }
                  });
                  window.dispatchEvent(openEvent);
                }}
                className="w-full bg-white rounded-2xl p-4 border border-blush/10 hover:scale-105 transition-all duration-300 shadow-lg text-left flex items-center space-x-4 complete-button-pulse"
              >
                {/* Icon with gradient circle */}
                <div className="p-3 rounded-full bg-gradient-feminine flex-shrink-0">
                  <IconComponent className="text-white" size={20} strokeWidth={1.5} />
                </div>
                
                {/* Text content */}
                <div className="flex-grow text-center">
                  <h3 className="platypi-bold text-lg text-black mb-1">
                    {brocha.title}
                  </h3>
                  {brocha.description && (
                    <p className="platypi-regular text-sm text-black/70">
                      {brocha.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 platypi-regular">
              No {activeTab} brochas available
            </p>
          </div>
        )}
      </div>
      
    </div>
  );
}

// Singleton to store morning brochas navigation state
let morningBrochasNavState = {
  expandedSection: 0,
  scrollToBottom: () => {}
};

// Wrapper component that provides context for both content and arrow
export function MorningBrochasWithNavigation({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  // State for managing which section is expanded
  const [expandedSection, setExpandedSection] = useState<number>(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to bottom of currently expanded section
  const scrollToBottomOfSection = () => {
    if (expandedSection >= 0 && sectionRefs.current[expandedSection]) {
      const sectionElement = sectionRefs.current[expandedSection];
      const sectionContent = sectionElement!.querySelector('div[class*="px-6 pb-6"]');
      const doneButton = sectionContent?.querySelector('button') || 
                         sectionElement!.querySelector('button[class*="bg-gradient-feminine"], button[class*="bg-sage"]');
      
      if (doneButton) {
        doneButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        sectionElement!.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  };

  // Update global state
  useEffect(() => {
    morningBrochasNavState = {
      expandedSection,
      scrollToBottom: scrollToBottomOfSection
    };
  }, [expandedSection]);

  return (
    <MorningBrochasFullscreenContent 
      language={language} 
      fontSize={fontSize}
      expandedSection={expandedSection}
      setExpandedSection={setExpandedSection}
      sectionRefs={sectionRefs}
    />
  );
}

function MorningBrochasFullscreenContent({ 
  language, 
  fontSize,
  expandedSection,
  setExpandedSection,
  sectionRefs
}: { 
  language: 'hebrew' | 'english';
  fontSize: number;
  expandedSection: number;
  setExpandedSection: (index: number) => void;
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}) {
  const { data: prayers = [], isLoading } = useQuery<MorningPrayer[]>({
    queryKey: ['/api/morning/prayers'],
  });

  const tefillaConditions = useTefillaConditions();
  const { completeTask } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();

  if (isLoading) return <div className="text-center py-8">Loading prayers...</div>;

  const handleComplete = () => {
    trackModalComplete('morning-brochas');
    markModalComplete('morning-brochas');
    completeTask('tefilla');
    // Close fullscreen
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
  };

  // Handle section expansion with scroll-to-top
  const handleSectionToggle = (sectionIndex: number) => {
    const isCurrentlyExpanded = expandedSection === sectionIndex;
    const newExpandedSection = isCurrentlyExpanded ? -1 : sectionIndex;
    
    setExpandedSection(newExpandedSection);
    
    // Scroll to top of the section when opening
    if (!isCurrentlyExpanded && sectionRefs.current[sectionIndex]) {
      setTimeout(() => {
        sectionRefs.current[sectionIndex]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100); // Small delay to allow the section to expand
    }
  };

  // Group prayers by orderIndex
  const groupedPrayers = prayers.reduce((groups, prayer) => {
    const orderIndex = prayer.orderIndex || 0;
    if (!groups[orderIndex]) {
      groups[orderIndex] = [];
    }
    groups[orderIndex].push(prayer);
    return groups;
  }, {} as Record<number, any[]>);

  // Get sorted order indices
  const sortedOrderIndices = Object.keys(groupedPrayers)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {sortedOrderIndices.map((orderIndex, sectionIndex) => {
        const sectionPrayers = groupedPrayers[orderIndex];
        const isExpanded = expandedSection === sectionIndex;
        const sectionTitle = sectionPrayers[0]?.prayerType || `Section ${orderIndex}`;

        return (
          <div 
            key={orderIndex} 
            ref={(el) => { sectionRefs.current[sectionIndex] = el; }}
            className="bg-white rounded-2xl border border-blush/10 overflow-hidden"
          >
            {/* Section Header - Clickable */}
            <button
              onClick={() => handleSectionToggle(sectionIndex)}
              className="w-full px-6 py-4 text-left hover:bg-blush/5 transition-colors flex items-center justify-between"
            >
              <h3 className="platypi-bold text-lg text-black">
                {sectionTitle}
              </h3>
              <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Section Content - Collapsible */}
            {isExpanded && (
              <div className="px-6 pb-6 space-y-4">
                {sectionPrayers.map((prayer: any, prayerIndex: number) => (
                  <div key={prayerIndex}>
                    <div
                      className={`${language === 'hebrew' ? 'vc-koren-hebrew text-right' : 'koren-siddur-english text-left'} leading-relaxed text-black`}
                      style={{ fontSize: language === 'hebrew' ? `${fontSize + 1}px` : `${fontSize}px` }}
                      dangerouslySetInnerHTML={{
                        __html: processTefillaContent(
                          language === 'hebrew' ? prayer.hebrewText : prayer.englishTranslation, 
                          tefillaConditions
                        ).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">')
                      }}
                    />
                  </div>
                ))}
                
                {/* Done Button for this section */}
                <Button
                  onClick={isModalComplete('morning-brochas') ? undefined : handleComplete}
                  disabled={isModalComplete('morning-brochas')}
                  className={`w-full py-3 rounded-xl platypi-medium border-0 mt-4 ${
                    isModalComplete('morning-brochas') 
                      ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                      : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                  }`}
                >
                  {isModalComplete('morning-brochas') ? 'Completed Today' : 'Complete'}
                </Button>
              </div>
            )}
          </div>
        );
      })}
      
      <KorenThankYou />
    </div>
  );
}

// Export the arrow separately for use in floating element
export function MorningBrochasNavigationArrow() {
  // Force re-render when state changes
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 100); // Poll for state changes
    
    return () => clearInterval(interval);
  }, []);
  
  if (morningBrochasNavState.expandedSection < 0) return null;
  
  return (
    <button
      onClick={morningBrochasNavState.scrollToBottom}
      className="fixed right-6 bg-gradient-feminine text-white rounded-full p-3 shadow-lg hover:scale-110 transition-all duration-200"
      style={{ 
        zIndex: 2147483646,
        bottom: 'calc(1.5rem + var(--viewport-bottom-offset, 0px))'
      }}
      aria-label="Jump to bottom of section"
      data-testid="button-scroll-to-section-bottom"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7" />
      </svg>
    </button>
  );
}

// Nishmas Fullscreen Content Component
function NishmasFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { data: nishmasText, isLoading } = useQuery<NishmasText>({
    queryKey: [`/api/nishmas/${language}`],
  });

  const { markModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { completeTask } = useDailyCompletionStore();
  
  // Nishmas 40-Day Campaign state with localStorage persistence
  const [nishmasDay, setNishmasDay] = useState(() => {
    const saved = localStorage.getItem('nishmas-day');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [nishmasStartDate, setNishmasStartDate] = useState<string | null>(() => {
    return localStorage.getItem('nishmas-start-date');
  });
  const [todayCompleted, setTodayCompleted] = useState(() => {
    const today = new Date().toDateString();
    const lastCompleted = localStorage.getItem('nishmas-last-completed');
    return lastCompleted === today;
  });

  // Load Nishmas progress from localStorage
  useEffect(() => {
    const savedDay = localStorage.getItem('nishmas-day');
    const savedStartDate = localStorage.getItem('nishmas-start-date');
    const savedLastCompleted = localStorage.getItem('nishmas-last-completed');
    const today = new Date().toDateString();
    
    // Check if today's prayer has already been completed
    setTodayCompleted(savedLastCompleted === today);
    
    if (savedDay && savedStartDate) {
      const startDate = new Date(savedStartDate);
      const currentDate = new Date(today);
      const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 40) {
        // Campaign completed
        if (daysDiff > 1) {
          // Missed a day, reset campaign
          setNishmasDay(0);
          setNishmasStartDate(null);
          setTodayCompleted(false);
          localStorage.removeItem('nishmas-day');
          localStorage.removeItem('nishmas-start-date');
          localStorage.removeItem('nishmas-last-completed');
          return;
        }
      }
      
      setNishmasDay(parseInt(savedDay));
      setNishmasStartDate(savedStartDate);
    }
  }, []);

  // Mark today's Nishmas as completed
  const markNishmasCompleted = () => {
    // Always track analytics and completion for repeatable prayers
    trackModalComplete('nishmas-campaign');
    markModalComplete('nishmas-campaign');
    completeTask('tefilla');
    
    // Check if 40-day campaign already completed today
    if (todayCompleted) {
      // Already completed today's 40-day campaign step, just close fullscreen
      const event = new CustomEvent('closeFullscreen');
      window.dispatchEvent(event);
      return;
    }
    
    const today = new Date().toDateString();
    const newDay = nishmasDay + 1;
    
    if (newDay <= 40) {
      setNishmasDay(newDay);
      setTodayCompleted(true);
      localStorage.setItem('nishmas-day', newDay.toString());
      localStorage.setItem('nishmas-last-completed', today);
      
      if (!nishmasStartDate) {
        const startDate = today;
        setNishmasStartDate(startDate);
        localStorage.setItem('nishmas-start-date', startDate);
      }
    }
    
    // Close fullscreen
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
  };

  if (isLoading) return <div className="text-center py-8">Loading prayer...</div>;

  return (
    <div className="space-y-6">
      {/* Prayer Content */}
      <div className="bg-white rounded-2xl p-6 border border-blush/10">
        <div 
          className={`leading-relaxed text-black ${
            language === 'hebrew' ? 'vc-koren-hebrew text-right' : 'koren-siddur-english text-left'
          }`} 
          style={{ fontSize: `${language === 'hebrew' ? fontSize + 1 : fontSize}px` }}
        >
          {nishmasText ? (
            <div 
              className="whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: formatTextContent(
                  nishmasText.fullText || 'Text not available'
                ).replace(/<strong>/g, language === 'hebrew' ? '<strong class="vc-koren-hebrew-bold">' : '<strong style="font-weight: 700;">')
              }}
            />
          ) : (
            <div className="text-red-600 text-center">Failed to load prayer text</div>
          )}
        </div>
      </div>

      {/* Segulah Information Section */}
      <div className="bg-gradient-to-r from-lavender-50 to-rose-50 rounded-2xl p-4 border border-lavender/20">
        <p className="text-sm platypi-medium text-black text-center leading-relaxed">
          Rebbetzin Leah Kolodetsky shared that her mother, Rebbetzin Kanievsky zt"l, believed reciting Nishmas Kol Chai for 40 consecutive days is a powerful segulah for having prayers answered.
        </p>
      </div>
      
      <KorenThankYou />

      <Button
        onClick={markNishmasCompleted}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          todayCompleted 
            ? 'bg-sage text-white hover:scale-105 transition-transform' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {todayCompleted ? 'Complete Again' : 'Complete'}
      </Button>
    </div>
  );
}

function CompassFullscreenContent() {
  return (
    <div className="space-y-6">
      <SimpleCompassUI />
    </div>
  );
}

function TehillimFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { selectedPsalm, tehillimReturnTab, setTehillimActiveTab, openModal, dailyTehillimPsalms } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const tefillaConditions = useTefillaConditions();

  // Check if we're coming from the selector page (psalm number 1-150) or from global chain (ID > 150)
  // Psalms from selector are always 1-150, while global chain IDs for psalm 119 parts are > 150
  const isFromSelector = selectedPsalm && selectedPsalm <= 150;

  // First get tehillim info to check if this is a specific part (by ID) or full psalm (by English number)
  // Skip this check if coming from selector - always treat as full psalm
  const { data: tehillimInfo } = useQuery<{
    id: number;
    englishNumber: number;
    partNumber: number;
    hebrewNumber: string;
  }>({
    queryKey: ['/api/tehillim/info', selectedPsalm],
    queryFn: async () => {
      if (!selectedPsalm) return null;
      // If from selector, don't fetch info - we want the full psalm
      if (isFromSelector) return null;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/info/${selectedPsalm}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedPsalm && !isFromSelector, // Don't fetch info if from selector
    staleTime: 0
  });

  // Use by-id endpoint if we have tehillim info (meaning selectedPsalm is an ID from global chain)
  // Otherwise use English number endpoint (for selector page or when no info available)
  const { data: tehillimText, isLoading } = useQuery({
    queryKey: tehillimInfo ? ['/api/tehillim/text/by-id', selectedPsalm, language] : ['/api/tehillim/text', selectedPsalm, language],
    queryFn: async () => {
      if (tehillimInfo && !isFromSelector) {
        // This is a specific part from global chain - use by-id endpoint
        const response = await axiosClient.get(`/api/tehillim/text/by-id/${selectedPsalm}?language=${language}`);
        return response.data;
      } else {
        // This is a full psalm from selector - use English number endpoint
        const response = await axiosClient.get(`/api/tehillim/text/${selectedPsalm}?language=${language}`);
        return response.data;
      }
    },
    enabled: !!selectedPsalm,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });

  if (isLoading) return <div className="text-center py-8">Loading Tehillim...</div>;
  if (!selectedPsalm) return <div className="text-center py-8">No Tehillim selected</div>;

  const completionKey = `individual-tehillim-${selectedPsalm}`;
  const isCompleted = isModalComplete(completionKey);

  const handleComplete = () => {
    trackModalComplete(completionKey);
    markModalComplete(completionKey);
    completeTask('tefilla');
    
    // Check if all tasks are completed and show congratulations
    if (checkAndShowCongratulations()) {
      openModal('congratulations', 'tefilla');
    }
    
    // Get the saved return tab preference from Zustand store
    const returnTab = tehillimReturnTab || 'all';

    
    // Set the correct tab first, BEFORE triggering the fullscreen event
    setTehillimActiveTab(returnTab);
    
    // Use setTimeout to ensure tab state is set before triggering fullscreen
    setTimeout(() => {
      // Switch back to special-tehillim fullscreen content
      const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
        detail: {
          title: 'Tehillim',
          contentType: 'special-tehillim',
          activeTab: returnTab // Pass the return tab to ensure correct display
        }
      });
      window.dispatchEvent(fullscreenEvent);
    }, 50);
  };

  const handleCompleteAndNext = async () => {
    if (!selectedPsalm) return;
    
    trackModalComplete(completionKey);
    markModalComplete(completionKey);
    completeTask('tefilla');
    
    // Check if congratulations should be shown - if yes, show it and stop navigation
    if (checkAndShowCongratulations()) {
      openModal('congratulations', 'tefilla');
      return; // Early exit - don't navigate to next psalm
    }
    
    // Determine next psalm based on context: Daily Tehillim list or sequential
    let nextPsalm: number;
    
    // Check if we're navigating within Daily Tehillim
    if (isFromDailyTehillim && hasNextDailyPsalm && nextDailyPsalm) {
      nextPsalm = nextDailyPsalm;
    } else if (tehillimInfo) {
      // This is a specific part by ID - handle 119 parts specially
      if (tehillimInfo.englishNumber === 119) {
        // For psalm 119, move to next part or to psalm 120 if this is the last part
        // Psalm 119 has 22 parts (parts 1-22)
        if (tehillimInfo.partNumber < 22) {
          // Move to next part of 119 - get the next part ID from the server
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/next-part/${selectedPsalm}`);
            if (response.ok) {
              const nextPartData = await response.json();
              nextPsalm = nextPartData.id;
            } else {
              // Fallback to next English number if API fails
              nextPsalm = 120;
            }
          } catch (error) {
            console.error('Failed to get next Tehillim part:', error);
            // Fallback to next English number
            nextPsalm = 120;
          }
        } else {
          // Last part of 119, move to psalm 120
          nextPsalm = 120;
        }
      } else {
        // For other specific parts, move to next psalm
        nextPsalm = Math.min(tehillimInfo.englishNumber + 1, 150);
      }
    } else {
      // This is a full psalm by English number - use simple increment (for 1-150 tab)
      nextPsalm = selectedPsalm < 150 ? selectedPsalm + 1 : 1;
    }
    
    // Update the selected psalm in the store
    const { setSelectedPsalm } = useModalStore.getState();
    setSelectedPsalm(nextPsalm);
    
    // The fullscreen content will automatically update due to the dependency on selectedPsalm
  };

  // Determine button layout based on stored return tab AND Daily Tehillim
  const isFromSpecialTab = tehillimReturnTab === 'special';
  const isFromDailyTehillim = dailyTehillimPsalms && dailyTehillimPsalms.includes(selectedPsalm || 0);
  const currentIndex = isFromDailyTehillim ? dailyTehillimPsalms.indexOf(selectedPsalm || 0) : -1;
  const hasNextDailyPsalm = isFromDailyTehillim && currentIndex >= 0 && currentIndex < dailyTehillimPsalms.length - 1;
  const nextDailyPsalm = hasNextDailyPsalm ? dailyTehillimPsalms[currentIndex + 1] : null;
  
  // Show Complete & Next button if from 1-150 tab OR from Daily Tehillim with next psalm available
  const showCompleteAndNext = !isFromSpecialTab || hasNextDailyPsalm;
  
  // Calculate next psalm number for button label
  const getNextPsalmNumber = () => {
    if (isFromDailyTehillim && nextDailyPsalm) {
      return nextDailyPsalm;
    }
    return selectedPsalm && selectedPsalm < 150 ? selectedPsalm + 1 : 1;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-blush/10">
        <div
          className={`${language === 'hebrew' ? 'vc-koren-hebrew text-right' : 'koren-siddur-english text-left'} leading-relaxed text-black`}
          style={{ fontSize: language === 'hebrew' ? `${fontSize + 1}px` : `${fontSize}px` }}
          dangerouslySetInnerHTML={{
            __html: processTefillaContent(tehillimText?.text || '', tefillaConditions)
          }}
        />
      </div>
      
      <KorenThankYou />

      {/* Button(s) based on whether Complete & Next should be shown */}
      {!showCompleteAndNext ? (
        // Single Complete button (Special occasions with no Daily Tehillim)
        <Button
          onClick={handleComplete}
          className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
            isCompleted 
              ? 'bg-sage text-white hover:scale-105 transition-transform' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
        >
          {isCompleted ? 'Complete Again' : 'Complete'}
        </Button>
      ) : (
        // Show both "Complete" and "Complete & Next" buttons
        <div className="flex gap-2">
          <Button
            onClick={handleComplete}
            className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
              isCompleted 
                ? 'bg-sage text-white hover:scale-105 transition-transform' 
                : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
            }`}
          >
            {isCompleted ? 'Again' : 'Complete'}
          </Button>
          
          <Button
            onClick={handleCompleteAndNext}
            className="flex-1 py-3 rounded-xl platypi-medium border-0 bg-gradient-sage-to-blush text-white hover:scale-105 transition-transform complete-next-button-pulse"
          >
            Complete & Next ({getNextPsalmNumber()})
          </Button>
        </div>
      )}
    </div>
  );
}

function GlobalTehillimFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { trackEvent } = useAnalytics();
  const { openModal } = useModalStore();
  const tefillaConditions = useTefillaConditions();
  const queryClient = useQueryClient();

  // Lock onto the current perek when fullscreen opens to prevent auto-refresh when others complete
  const [lockedPerek, setLockedPerek] = useState<number | null>(null);

  // Get current global Tehillim progress
  const { data: progress } = useQuery<GlobalTehillimProgress>({
    queryKey: ['/api/tehillim/progress'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/progress`);
      if (!response.ok) throw new Error('Failed to fetch progress');
      return response.json();
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 180000 // Refetch every 3 minutes (reduced from 1min for performance)
  });

  // Lock onto current perek when component mounts to prevent auto-refresh
  useEffect(() => {
    if (progress?.currentPerek && !lockedPerek) {
      setLockedPerek(progress.currentPerek);
    }
  }, [progress?.currentPerek, lockedPerek]);

  // Use locked perek instead of live progress to prevent auto-refresh
  const activePerek = lockedPerek || progress?.currentPerek;

  // Get current psalm text using the locked perek (using by-id endpoint for proper part handling)
  const { data: tehillimText, isLoading } = useQuery({
    queryKey: ['/api/tehillim/text/by-id', activePerek, language],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/tehillim/text/by-id/${activePerek}?language=${language}`);
      return response.data;
    },
    enabled: !!activePerek,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });

  // Get current name being prayed for
  const { data: currentName } = useQuery<TehillimName>({
    queryKey: ['/api/tehillim/current-name'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/current-name`);
      if (!response.ok) throw new Error('Failed to fetch current name');
      return response.json();
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 180000 // Refetch every 3 minutes (reduced from 30s for performance)
  });

  // Define mutations before any conditional returns (hooks rule)
  const advanceChainMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPerek: activePerek,
          language: language,
          completedBy: 'Anonymous'
        }),
      });
      if (!response.ok) throw new Error('Failed to advance chain');
      return response.json();
    },
    onSuccess: () => {
      // Track tehillim completion for analytics
      trackEvent("tehillim_complete", { 
        perek: activePerek,
        language: language
      });
      
      // Track name prayed for if there was one
      if (currentName) {
        trackEvent("name_prayed", {
          nameId: currentName.id,
          reason: currentName.reason,
          perek: activePerek
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
      
      // Invalidate analytics stats to show updated counts immediately
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/month'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/total'] });
    },
    onError: (error) => {
      console.error('Failed to advance chain:', error);
      toast({
        title: "Error",
        description: "Failed to advance Tehillim chain",
        variant: "destructive",
      });
    }
  });

  // Smart Complete and Next mutation - completes current and opens next available perek
  const completeAndNextMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Complete the current perek
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPerek: activePerek,
          language: language,
          completedBy: 'Anonymous'
        }),
      });
      if (!response.ok) throw new Error('Failed to advance chain');
      
      const updatedProgress = await response.json();
      
      // Step 2: Fetch the next perek's text immediately
      // Use the by-id endpoint for global chain (which uses IDs that can exceed 150)
      const textResponse = await axiosClient.get(`/api/tehillim/text/by-id/${updatedProgress.currentPerek}?language=${language}`);
      
      return {
        progress: updatedProgress,
        nextTehillimText: textResponse.data
      };
    },
    onSuccess: (data) => {
      // Track tehillim completion for analytics
      trackEvent("tehillim_complete", { 
        perek: activePerek,
        language: language
      });
      
      // Track name prayed for if there was one
      if (currentName) {
        trackEvent("name_prayed", {
          nameId: currentName.id,
          reason: currentName.reason,
          perek: activePerek
        });
      }
      
      // Update locked perek to the next one when completing and advancing
      setLockedPerek(data.progress.currentPerek);
      
      // Invalidate queries to refresh data for the next perek
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/text'] });
      
      // Invalidate analytics stats to show updated counts immediately
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/month'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/total'] });
      
      // Trigger event to refresh main tehillim section
      const event = new CustomEvent('tehillimCompleted');
      window.dispatchEvent(event);
    },
    onError: (error) => {
      console.error('Failed to complete and advance chain:', error);
      toast({
        title: "Error",
        description: "Failed to advance to next Tehillim",
        variant: "destructive",
      });
    }
  });

  // Early returns after all hooks are defined
  if (isLoading) return <div className="text-center py-8">Loading Tehillim...</div>;
  if (!activePerek) return <div className="text-center py-8">No Tehillim available</div>;

  // Use unique key per Tehillim number for proper individual tracking
  const completionKey = `tehillim-chain-${activePerek}`;
  const isCompleted = isModalComplete(completionKey);

  const handleComplete = () => {
    // Track modal completion for feature usage (use unique key to avoid double counting)
    trackModalComplete('global-tehillim-chain');
    markModalComplete('tehillim-text');
    completeTask('tefilla');
    
    // Advance the chain (this will trigger the analytics tracking in onSuccess)
    advanceChainMutation.mutate();
    
    // Check if congratulations should be shown - if yes, show it and stop closing
    if (checkAndShowCongratulations()) {
      openModal('congratulations', 'tefilla');
    } else {
      // Only close fullscreen if congratulations wasn't shown
      const event = new CustomEvent('closeFullscreen');
      window.dispatchEvent(event);
    }
  };

  const handleCompleteAndNext = async () => {
    // Track modal completion for feature usage (use unique key to avoid double counting)
    trackModalComplete('global-tehillim-chain');
    markModalComplete('tehillim-text');
    completeTask('tefilla');
    
    // Check if congratulations should be shown - if yes, show it and stop navigation
    if (checkAndShowCongratulations()) {
      openModal('congratulations', 'tefilla');
      return; // Early exit - don't open next fullscreen
    }
    
    // Complete current and advance to next perek
    try {
      const result = await completeAndNextMutation.mutateAsync();
      
      // Trigger fullscreen modal for the next perek
      const fullscreenEvent = new CustomEvent('openGlobalTehillimFullscreen', {
        detail: {
          nextPerek: result.progress.currentPerek,
          language: language
        }
      });
      window.dispatchEvent(fullscreenEvent);
      
    } catch (error) {
      console.error('Failed to complete and advance:', error);
      // On error, just close fullscreen
      const event = new CustomEvent('closeFullscreen');
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current name being prayed for - moved above Tehillim text */}
      {currentName && (
        <div className="bg-sage/10 rounded-xl p-3 border border-sage/20">
          <div className="flex items-center justify-center gap-2">
            {getReasonIcon(currentName.reasonEnglish || currentName.reason)}
            <p className="text-sm platypi-medium text-black">
              Davening for: {currentName.hebrewName}
            </p>
            <span className="text-xs platypi-regular text-black/60">
              ({currentName.reasonEnglish || currentName.reason})
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-blush/10">
        <div
          className={`${language === 'hebrew' ? 'vc-koren-hebrew text-right' : 'koren-siddur-english text-left'} leading-relaxed text-black`}
          style={{ fontSize: language === 'hebrew' ? `${fontSize + 1}px` : `${fontSize}px` }}
          dangerouslySetInnerHTML={{
            __html: processTefillaContent(tehillimText?.text || '', tefillaConditions)
          }}
        />
      </div>
      
      <KorenThankYou />

      <div className="flex gap-2 mt-6">
        {/* Complete button - returns to previous view */}
        <Button
          onClick={handleComplete}
          disabled={advanceChainMutation.isPending || completeAndNextMutation.isPending}
          className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
            isCompleted 
              ? 'bg-sage text-white hover:scale-105 transition-transform' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
        >
          {advanceChainMutation.isPending ? 'Completing...' : isCompleted ? 'Complete Again' : 'Complete'}
        </Button>
        
        {/* Complete and Next button - goes to next tehillim in chain */}
        <Button
          onClick={handleCompleteAndNext}
          disabled={advanceChainMutation.isPending || completeAndNextMutation.isPending}
          className="flex-1 py-3 rounded-xl platypi-medium border-0 bg-gradient-sage-to-blush text-white hover:scale-105 transition-transform complete-next-button-pulse"
        >
          {completeAndNextMutation.isPending ? 'Loading Next...' : 'Complete & Next'}
        </Button>
      </div>
    </div>
  );
}

function IndividualPrayerFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { completeTask } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const tefillaConditions = useTefillaConditions();
  
  // Get the prayer ID from global window property set in handlePrayerSelect
  const selectedPrayerId = (window as any).selectedPrayerId;
  
  // Use TanStack Query to fetch prayer data - same pattern as IndividualPrayerContent
  const { data: prayer, isLoading } = useQuery<WomensPrayer>({
    queryKey: [`/api/womens-prayers/prayer/${selectedPrayerId}`],
    enabled: !!selectedPrayerId,
  });

  // Update fullscreen content translation availability when prayer loads
  useEffect(() => {
    if (prayer && (window as any).updateFullscreenHasTranslation) {
      const hasTranslation = !!(prayer.englishTranslation?.trim());
      (window as any).updateFullscreenHasTranslation(hasTranslation);
    }
  }, [prayer]);

  // Update fullscreen title when prayer loads
  useEffect(() => {
    if (prayer && prayer.prayerName && (window as any).updateFullscreenTitle) {
      (window as any).updateFullscreenTitle(prayer.prayerName);
    }
  }, [prayer]);

  // Use unique key per prayer for proper individual tracking
  const modalKey = `womens-prayer-${prayer?.id || selectedPrayerId}`;

  const handleComplete = () => {
    trackModalComplete(modalKey);
    markModalComplete(modalKey);
    completeTask('tefilla');
    
    // Close fullscreen and navigate home
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
    setTimeout(() => {
      window.location.hash = '#/?section=home&scrollToProgress=true';
    }, 100);
  };

  if (isLoading) return <div className="text-center py-8">Loading prayer...</div>;
  if (!prayer) return <div className="text-center py-8">Prayer not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-blush/10">
        {prayer.hebrewText && language === 'hebrew' && (
          <div 
            className="vc-koren-hebrew leading-relaxed"
            style={{ fontSize: `${fontSize + 1}px` }}
            dangerouslySetInnerHTML={{ 
              __html: processTefillaContent(prayer.hebrewText, tefillaConditions).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">')
            }}
          />
        )}
        {language === 'english' && prayer.englishTranslation && (
          <div 
            className="koren-siddur-english text-left leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.englishTranslation || 'English translation not available', tefillaConditions) }}
          />
        )}
      </div>
      
      {/* Conditional attribution based on prayer name and ID */}
      {prayer.prayerName !== "Parshat Hamann" && prayer.prayerName !== "Hafrashas Challah" && prayer.id !== 10 && (
        <ChuppahThankYou />
      )}
      
      <Button 
        onClick={handleComplete}
        className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
          isModalComplete(modalKey) 
            ? 'bg-sage text-white hover:scale-105 transition-transform' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete(modalKey) ? 'Complete Again' : 'Complete'}
      </Button>
    </div>
  );
}

export default function TefillaModals({ onSectionChange }: TefillaModalsProps) {
  const { activeModal, openModal, closeModal, selectedPsalm } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [fontSize, setFontSize] = useState(20);
  const [showHebrew, setShowHebrew] = useState(() => {
    // Check for saved language preference for Tehillim
    const savedLang = localStorage.getItem('tehillim-language');
    return savedLang !== 'english';
  });
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null);
  const [isAnimating, ] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [activeExplosionModal, setActiveExplosionModal] = useState<string | null>(null);
  const [showMorningBrochasInfo, setShowMorningBrochasInfo] = useState(false);
  const [showMaarivInfo, setShowMaarivInfo] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    contentType?: string;
    hasTranslation?: boolean;
  }>({ isOpen: false, title: '', content: null });

  // Function to update fullscreen translation availability
  const updateFullscreenHasTranslation = (hasTranslation: boolean) => {
    setFullscreenContent(prev => ({ ...prev, hasTranslation }));
  };

  // Function to update fullscreen title
  const updateFullscreenTitle = (title: string) => {
    setFullscreenContent(prev => ({ ...prev, title }));
  };

  // Make functions available globally for the fullscreen content component
  useEffect(() => {
    (window as any).updateFullscreenHasTranslation = updateFullscreenHasTranslation;
    (window as any).updateFullscreenTitle = updateFullscreenTitle;
    return () => {
      delete (window as any).updateFullscreenHasTranslation;
      delete (window as any).updateFullscreenTitle;
    };
  }, []);
  
  // Load Tefilla conditions for conditional content processing
  const tefillaConditions = useTefillaConditions();
  
  // Get Jewish times for info tooltips  
  const jewishTimesQuery = useJewishTimes();

  // Helper function to create Morning Brochas tooltip content
  const getMorningBrochasTooltip = () => {
    if (!jewishTimesQuery.data) return "Loading timing information...";
    const times = jewishTimesQuery.data;
    return (
      <p className="text-xs text-black">
        It is better to Daven between Netz {times.sunrise} and Sof Zman Tefilla {times.sofZmanTfilla}. Birchas Kriyas Shema should not be recited after Sof Zman Tefilla.
      </p>
    );
  };

  // Helper function to create Maariv tooltip content
  const getMaarivTooltip = () => {
    if (!jewishTimesQuery.data) return "Loading timing information...";
    const times = jewishTimesQuery.data;
    return (
      <p className="text-xs text-black">
        It is better to daven between Tzeitz {times.tzaitHakochavim} and Chatsos Halyla {times.chatzotNight}.
      </p>
    );
  };

  // Listen for fullscreen close events from fullscreen components
  useEffect(() => {
    const handleCloseFullscreen = () => {
      setFullscreenContent({ isOpen: false, title: '', content: null });
    };

    const handleDirectFullscreen = (event: CustomEvent) => {
      const { title, contentType, modalKey } = event.detail;
      
      // Only handle tefilla-related fullscreen requests
      if (modalKey && ['recipe', 'inspiration'].includes(modalKey)) {
        return; // Let table-modals handle these
      }
      
      setFullscreenContent({
        isOpen: true,
        title,
        contentType,
        content: null
      });
    };

    const handleGlobalTehillimFullscreen = (event: CustomEvent) => {
      const { nextPerek, language: eventLanguage } = event.detail;
      
      // Set the language if provided
      if (eventLanguage) {
        setLanguage(eventLanguage);
      }
      
      // Open fullscreen for global tehillim with the next perek
      // Get the proper title using tehillim info
      fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/info/${nextPerek}`)
        .then(response => response.ok ? response.json() : null)
        .then(tehillimInfo => {
          let title = `Perek ${nextPerek}`;
          if (tehillimInfo) {
            if (tehillimInfo.partNumber > 1) {
              title = `Tehillim ${tehillimInfo.englishNumber} Part ${tehillimInfo.partNumber}`;
            } else {
              title = `Tehillim ${tehillimInfo.englishNumber}`;
            }
          }
          
          setFullscreenContent({
            isOpen: true,
            title: title,
            contentType: 'global-tehillim',
            content: null,
            hasTranslation: true
          });
        })
        .catch(() => {
          // Fallback to basic title if API fails
          setFullscreenContent({
            isOpen: true,
            title: `Perek ${nextPerek}`,
            contentType: 'global-tehillim',
            content: null,
            hasTranslation: true
          });
        });
    };

    window.addEventListener('closeFullscreen', handleCloseFullscreen);
    window.addEventListener('openDirectFullscreen', handleDirectFullscreen as EventListener);
    window.addEventListener('openGlobalTehillimFullscreen', handleGlobalTehillimFullscreen as EventListener);
    return () => {
      window.removeEventListener('closeFullscreen', handleCloseFullscreen);
      window.removeEventListener('openDirectFullscreen', handleDirectFullscreen as EventListener);
      window.removeEventListener('openGlobalTehillimFullscreen', handleGlobalTehillimFullscreen as EventListener);
    };
  }, []);

  // Reset explosion state when modal changes
  useEffect(() => {
    setShowExplosion(false);
  }, [activeModal]);

  // Auto-redirect prayer modals to fullscreen
  useEffect(() => {
    const fullscreenPrayerModals = ['morning-brochas', 'mincha', 'maariv', 'nishmas-campaign', 'individual-tehillim', 'tehillim-text', 'special-tehillim', 'brochas'];
    
    if (activeModal && fullscreenPrayerModals.includes(activeModal)) {
      let title = '';
      let contentType = activeModal;
      
      switch (activeModal) {
        case 'morning-brochas':
          title = 'Shacharis';
          break;
        case 'mincha':
          title = 'Mincha Prayer';
          break;
        case 'maariv':
          title = 'Maariv Prayer';
          break;
        case 'nishmas-campaign':
          title = 'Nishmas Kol Chai';
          break;
        case 'individual-tehillim':
          title = `Tehillim ${selectedPsalm}`; // Will be updated by useEffect
          contentType = 'individual-tehillim';
          break;
        case 'tehillim-text':
          title = 'Sefer Tehillim';
          contentType = 'tehillim-text';
          break;
        case 'special-tehillim':
          title = 'Sefer Tehillim';
          contentType = 'special-tehillim';
          break;
        case 'brochas':
          title = 'Brochas';
          contentType = 'brochas';
          break;
      }
      
      // Open fullscreen immediately without closing modal first
      setFullscreenContent({
        isOpen: true,
        title,
        contentType,
        content: null // Content will be rendered based on contentType
      });
      
      // Close the regular modal immediately with fullscreen opens
      closeModal();
    }
  }, [activeModal, closeModal, selectedPsalm]);

  // Update fullscreen title when selectedPsalm changes for individual Tehillim
  useEffect(() => {
    if (fullscreenContent.isOpen && fullscreenContent.contentType === 'individual-tehillim' && selectedPsalm) {
      // Check if we're coming from the selector page (psalm number 1-150) or from global chain (ID > 150)
      const isFromSelector = selectedPsalm && selectedPsalm <= 150;
      
      if (isFromSelector) {
        // For selector pages, just use the psalm number directly
        setFullscreenContent(current => ({
          ...current,
          title: `Tehillim ${selectedPsalm}`
        }));
      } else {
        // For global chain, fetch tehillim info to construct proper title with parts
        fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/info/${selectedPsalm}`)
          .then(response => response.ok ? response.json() : null)
          .then(tehillimInfo => {
            let title = `Tehillim ${selectedPsalm}`;
            if (tehillimInfo) {
              if (tehillimInfo.partNumber > 1) {
                title = `Tehillim ${tehillimInfo.englishNumber} Part ${tehillimInfo.partNumber}`;
              } else {
                title = `Tehillim ${tehillimInfo.englishNumber}`;
              }
            }
            
            setFullscreenContent(current => ({
              ...current,
              title: title
            }));
          })
          .catch(() => {
            // Fallback to selectedPsalm if API fails
            setFullscreenContent(current => ({
              ...current,
              title: `Tehillim ${selectedPsalm}`
            }));
          });
      }
    }
  }, [selectedPsalm, fullscreenContent.isOpen, fullscreenContent.contentType]);

  // Listen for custom close fullscreen events
  useEffect(() => {
    const handleCloseFullscreen = () => {
      const wasIndividualBrocha = fullscreenContent.contentType === 'individual-brocha';
      
      setFullscreenContent({ isOpen: false, title: '', content: null });
      // Close any active modal to reset state properly
      closeModal();
      
      if (wasIndividualBrocha) {
        // Go back to Brochas selector instead of home
        setTimeout(() => {
          setFullscreenContent({
            isOpen: true,
            title: 'Brochas',
            contentType: 'brochas',
            content: null
          });
        }, 100);
      } else {
        // Navigate to home section and show flower growth for other types
        if (onSectionChange) {
          onSectionChange('home');
          setTimeout(() => {
            const progressElement = document.getElementById('daily-progress-garden');
            if (progressElement) {
              progressElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }, 300);
        }
      }
    };

    window.addEventListener('closeFullscreen', handleCloseFullscreen);
    return () => window.removeEventListener('closeFullscreen', handleCloseFullscreen);
  }, [onSectionChange]);

  const handlePrayerSelect = (prayerId: number) => {
    setSelectedPrayerId(prayerId);
    closeModal();
    
    // Open fullscreen directly with the prayer ID stored globally for access by the fullscreen component
    (window as any).selectedPrayerId = prayerId;
    setFullscreenContent({
      isOpen: true,
      title: 'Prayer', // Will be updated when prayer data loads
      contentType: 'individual-prayer',
      content: null
      // hasTranslation will be determined when prayer data loads
    });
  };

  // Complete prayer with task tracking
  const completeWithAnimation = (specificModal?: string) => {
    // Use specific modal if provided, otherwise use activeModal
    const modalToComplete = specificModal || activeModal;
    
    // Track modal completion and mark as completed globally
    if (modalToComplete) {
      // Only complete the specific modal that was clicked
      trackModalComplete(modalToComplete);
      markModalComplete(modalToComplete);
    }
    
    setShowExplosion(true);
    setActiveExplosionModal(modalToComplete);
    
    // Wait for animation to complete before proceeding
    setTimeout(() => {
      setShowExplosion(false); // Reset explosion state
      setActiveExplosionModal(null);
      completeTask('tefilla');
      closeModal();
      
      // Navigate to home section and scroll to progress to show flower growth
      if (onSectionChange) {
        onSectionChange('home');
        // Also scroll to progress section
        setTimeout(() => {
          const progressElement = document.getElementById('daily-progress-garden');
          if (progressElement) {
            progressElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 300);
      } else {
        // Fallback: redirect to home with scroll parameter
        window.location.hash = '#/?section=home&scrollToProgress=true';
      }
      
      // Check if all tasks are completed and show congratulations
      setTimeout(() => {
        if (checkAndShowCongratulations()) {
          openModal('congratulations', 'tefilla');
        }
      }, 200);
    }, 500);
  };

  // Nishmas 40-Day Campaign state with localStorage persistence
  const [, setNishmasDay] = useState(() => {
    const saved = localStorage.getItem('nishmas-day');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [, setNishmasStartDate] = useState<string | null>(() => {
    return localStorage.getItem('nishmas-start-date');
  });
  const [nishmasLanguage, setNishmasLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [, setTodayCompleted] = useState(() => {
    const today = new Date().toDateString();
    const lastCompleted = localStorage.getItem('nishmas-last-completed');
    return lastCompleted === today;
  });
  const [nishmasFontSize, setNishmasFontSize] = useState(20);
  const [showNishmasInfo, setShowNishmasInfo] = useState(false);

  // Get Tefilla conditions for conditional content processing
  const conditions = useTefillaConditions();

  const { data: minchaPrayers = [], isLoading } = useQuery<MinchaPrayer[]>({
    queryKey: ['/api/mincha/prayers'],
    enabled: activeModal === 'mincha'
  });

  // Fetch Maariv prayers
  const { data: maarivPrayers = [], isLoading: isMaarivLoading } = useQuery<any[]>({
    queryKey: ['/api/maariv/prayers'],
    enabled: activeModal === 'maariv'
  });


  // Don't intercept Maariv - let it render as a direct fullscreen modal
  // This will be handled in the JSX return instead

  // Fetch Nishmas text from database
  const { data: nishmasText, isLoading: nishmasLoading } = useQuery<NishmasText>({
    queryKey: [`/api/nishmas/${nishmasLanguage}`],
    enabled: activeModal === 'nishmas-campaign'
  });

  // Fetch global Tehillim progress
  const { data: progress } = useQuery<GlobalTehillimProgress>({
    queryKey: ['/api/tehillim/progress'], 
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/progress`);
      const data = await response.json();
      return data;
    },
    enabled: activeModal === 'tehillim-text',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  });

  // Fetch current name for the perek
  useQuery<TehillimName | null>({
    queryKey: ['/api/tehillim/current-name'],
    enabled: activeModal === 'tehillim-text',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  });

  // Get the tehillim info first to get the English number
  useQuery<{
    id: number;
    englishNumber: number;
    partNumber: number;
    hebrewNumber: string;
  }>({
    queryKey: ['/api/tehillim/info', progress?.currentPerek],
    queryFn: async () => {
      if (!progress?.currentPerek) return null;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/info/${progress.currentPerek}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: activeModal === 'tehillim-text' && !!progress?.currentPerek,
    staleTime: 0
  });

  // Fetch Tehillim text from Supabase using ID (for proper part handling)
  useQuery<{text: string; perek: number; language: string}>({
    queryKey: ['/api/tehillim/text/by-id', progress?.currentPerek, showHebrew ? 'hebrew' : 'english'],
    queryFn: async () => {
      if (!progress?.currentPerek) return null;
      const response = await axiosClient.get(`/api/tehillim/text/by-id/${progress.currentPerek}?language=${showHebrew ? 'hebrew' : 'english'}`);
      return response.data;
    },
    enabled: activeModal === 'tehillim-text' && !!progress?.currentPerek,
    staleTime: 0 // Always consider data stale to force fresh fetches
  });



  // Load Nishmas progress from localStorage
  useEffect(() => {
    const savedDay = localStorage.getItem('nishmas-day');
    const savedStartDate = localStorage.getItem('nishmas-start-date');
    const savedLastCompleted = localStorage.getItem('nishmas-last-completed');
    const today = new Date().toDateString();
    
    // Check if today's prayer has already been completed
    setTodayCompleted(savedLastCompleted === today);
    
    if (savedDay && savedStartDate) {
      const lastCompleted = savedLastCompleted || '';
      
      // Check if user missed a day - if so, reset to day 1
      if (lastCompleted !== today && lastCompleted !== '') {
        const lastDate = new Date(lastCompleted);
        const todayDate = new Date();
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) {
          // Missed a day, reset campaign
          setNishmasDay(0);
          setNishmasStartDate(null);
          setTodayCompleted(false);
          localStorage.removeItem('nishmas-day');
          localStorage.removeItem('nishmas-start-date');
          localStorage.removeItem('nishmas-last-completed');
          return;
        }
      }
      
      setNishmasDay(parseInt(savedDay));
      setNishmasStartDate(savedStartDate);
    }
  }, []);



  return (
    <>
      {/* Mincha Modal */}
      <Dialog open={activeModal === 'mincha'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="mincha-description">
          <div id="mincha-description" className="sr-only">Afternoon prayer service and instructions</div>
          
          {/* Fullscreen button */}
          <button
            onClick={() => {
              setFullscreenContent({
                isOpen: true,
                title: 'Mincha Prayer',
                content: (
                  <div className="space-y-4">
                    <div className="space-y-6">
                      {minchaPrayers.map((prayer) => (
                        <div key={prayer.id} className="bg-white rounded-2xl p-4 border border-blush/10">
                          {prayer.hebrewText && language === 'hebrew' && (
                            <div 
                              className="vc-koren-hebrew leading-relaxed"
                              style={{ fontSize: `${fontSize + 1}px` }}
                              dangerouslySetInnerHTML={{ 
                                __html: processTefillaContent(prayer.hebrewText, tefillaConditions)
                              }}
                            />
                          )}
                          {language === 'english' && (
                            <div 
                              className="koren-siddur-english text-left leading-relaxed text-black/70"
                              style={{ fontSize: `${fontSize}px` }}
                              dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.englishTranslation || "English translation not available", tefillaConditions) }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <KorenThankYou />
                    
                    <div className="heart-explosion-container">
                      <Button 
                        onClick={isModalComplete('mincha') ? undefined : () => {
                          trackModalComplete('mincha');
                          markModalComplete('mincha');
                          completeTask('tefilla');
                          setFullscreenContent({ isOpen: false, title: '', content: null });
                          
                          // Check if all tasks are completed and show congratulations
                          if (checkAndShowCongratulations()) {
                            openModal('congratulations', 'tefilla');
                          }
                        }}
                        disabled={isModalComplete('mincha')}
                        className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                          isModalComplete('mincha') 
                            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                        }`}
                      >
                        {isModalComplete('mincha') ? 'Completed Today' : 'Complete'}
                      </Button>
                    </div>
                  </div>
                )
              });
            }}
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Open fullscreen"
          >
            <Expand className="h-4 w-4 text-gray-600" />
          </button>
          
          <StandardModalHeader 
            title="Mincha Prayer"
            showHebrew={language === 'hebrew'}
            setShowHebrew={(show) => setLanguage(show ? 'hebrew' : 'english')}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />

          <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[50vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {minchaPrayers.map((prayer) => (
                  <div key={prayer.id} className="space-y-3 border-b border-warm-gray/10 pb-4 last:border-b-0">
                    {prayer.hebrewText && language === 'hebrew' && (
                      <div 
                        className="vc-koren-hebrew leading-relaxed"
                        style={{ fontSize: `${fontSize + 1}px` }}
                        dangerouslySetInnerHTML={{ 
                          __html: processTefillaContent(prayer.hebrewText, conditions)
                        }}
                      />
                    )}
                    {language === 'english' && (
                      <div 
                        className="koren-siddur-english text-left leading-relaxed text-black/70"
                        style={{ fontSize: `${fontSize}px` }}
                        dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.englishTranslation || "English translation not available", tefillaConditions) }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <KorenThankYou />

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('mincha') ? undefined : () => completeWithAnimation()}
              disabled={isModalComplete('mincha')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('mincha') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('mincha') ? 'Completed Today' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Women's Prayers Modal */}
      <Dialog open={activeModal === 'womens-prayers'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-hidden platypi-regular" aria-describedby="womens-prayers-description">
          <div id="womens-prayers-description" className="sr-only">Special prayers and blessings for women</div>
          
          <StandardModalHeader 
            title="Women's Prayers"
            showHebrew={showHebrew}
            setShowHebrew={setShowHebrew}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          
          <div className="space-y-3">
            <div 
              className={`content-card rounded-xl p-4 ${
                isModalComplete('blessings') 
                  ? 'bg-sage/20 border-sage cursor-not-allowed' 
                  : 'cursor-pointer hover:bg-gray-50'
              }`}
              onClick={() => {
                if (!isModalComplete('blessings')) {
                  closeModal();
                  openModal('blessings', 'tefilla');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <HandHeart className={isModalComplete('blessings') ? "text-sage" : "text-blush"} size={20} />
                  <span className="platypi-medium">Blessings</span>
                </div>
                {isModalComplete('blessings') && (
                  <Check className="text-sage" size={20} />
                )}
              </div>
            </div>
            
            <div 
              className={`content-card rounded-xl p-4 ${
                isModalComplete('tefillos') 
                  ? 'bg-sage/20 border-sage cursor-not-allowed' 
                  : 'cursor-pointer hover:bg-gray-50'
              }`}
              onClick={() => {
                if (!isModalComplete('tefillos')) {
                  closeModal();
                  openModal('tefillos', 'tefilla');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Scroll className={isModalComplete('tefillos') ? "text-sage" : "text-peach"} size={20} />
                  <span className="platypi-medium">Tefillos</span>
                </div>
                {isModalComplete('tefillos') && (
                  <Check className="text-sage" size={20} />
                )}
              </div>
            </div>
            
            <div 
              className={`content-card rounded-xl p-4 ${
                isModalComplete('personal-prayers') 
                  ? 'bg-sage/20 border-sage cursor-not-allowed' 
                  : 'cursor-pointer hover:bg-gray-50'
              }`}
              onClick={() => {
                if (!isModalComplete('personal-prayers')) {
                  closeModal();
                  openModal('personal-prayers', 'tefilla');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Heart className={isModalComplete('personal-prayers') ? "text-sage" : "text-blush"} size={20} />
                  <span className="platypi-medium">Personal Prayers</span>
                </div>
                {isModalComplete('personal-prayers') && (
                  <Check className="text-sage" size={20} />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Blessings Modal */}
      <Dialog open={activeModal === 'blessings'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] platypi-regular" aria-describedby="blessings-description">
          <div id="blessings-description" className="sr-only">Daily blessings and their proper recitation</div>
          
          <StandardModalHeader 
            title="Blessings"
            showHebrew={showHebrew}
            setShowHebrew={setShowHebrew}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          


          <div className="heart-explosion-container">
            <Button 
              onClick={() => completeWithAnimation('blessings')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('blessings') 
                  ? 'bg-sage text-white hover:scale-105 transition-transform' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('blessings') ? 'Complete Again' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion && activeExplosionModal === 'blessings'} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Tefillos Modal */}
      <Dialog open={activeModal === 'tefillos'} onOpenChange={() => closeModal(true)}>
        <DialogContent className={`w-full max-w-md rounded-3xl p-6 max-h-[90vh] platypi-regular ${isAnimating ? 'prayer-ascending' : ''}`} aria-describedby="tefillos-description">
          <div id="tefillos-description" className="sr-only">Traditional prayers and their meanings</div>
          
          <StandardModalHeader 
            title="Tefillos"
            showHebrew={showHebrew}
            setShowHebrew={setShowHebrew}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          


          <div className="heart-explosion-container">
            <Button 
              onClick={() => completeWithAnimation('tefillos')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('tefillos') 
                  ? 'bg-sage text-white hover:scale-105 transition-transform' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('tefillos') ? 'Complete Again' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion && activeExplosionModal === 'tefillos'} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Personal Prayers Modal */}
      <Dialog open={activeModal === 'personal-prayers'} onOpenChange={() => closeModal(true)}>
        <DialogContent className={`w-full max-w-md rounded-3xl p-6 max-h-[90vh] platypi-regular ${isAnimating ? 'prayer-ascending' : ''}`} aria-describedby="personal-prayers-description">
          <div id="personal-prayers-description" className="sr-only">Guidance for personal prayer and connection</div>
          
          <div className="flex items-center justify-center mb-3 relative">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-lg platypi-bold text-black">Personal Prayers</DialogTitle>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <span className="text-xs platypi-medium">-</span>
                </button>
                <span className="text-xs platypi-medium text-black/70 w-6 text-center">{fontSize}</span>
                <button
                  onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <span className="text-xs platypi-medium">+</span>
                </button>
              </div>
            </div>
          </div>
          


          <div className="heart-explosion-container">
            <Button 
              onClick={() => completeWithAnimation('personal-prayers')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('personal-prayers') 
                  ? 'bg-sage text-white hover:scale-105 transition-transform' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('personal-prayers') ? 'Complete Again' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion && activeExplosionModal === 'personal-prayers'} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Nishmas Kol Chai Modal */}
      <Dialog open={activeModal === 'nishmas-campaign'} onOpenChange={() => closeModal(true)}>
        <DialogContent className={`w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular ${isAnimating ? 'prayer-ascending' : ''}`}>
          {/* Fullscreen button in top left */}
          <button
            onClick={() => {
              if (nishmasText) {
                setFullscreenContent({
                  isOpen: true,
                  title: 'Nishmas Kol Chai',
                  content: (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl p-4 border border-blush/10">
                        <div 
                          className={`leading-relaxed text-black ${
                            nishmasLanguage === 'hebrew' ? 'vc-koren-hebrew' : 'koren-siddur-english text-left'
                          }`}
                          style={{ fontSize: nishmasLanguage === 'hebrew' ? `${fontSize + 1}px` : `${fontSize}px` }}
                        >
                          <div 
                            className="whitespace-pre-wrap leading-relaxed"
                            dangerouslySetInnerHTML={{ 
                              __html: formatTextContent(
                                nishmasText.fullText || 'Text not available'
                              ).replace(/<strong>/g, nishmasLanguage === 'hebrew' ? '<strong class="vc-koren-hebrew-bold">' : '<strong style="font-weight: 700;">')
                            }}
                          />
                        </div>
                      </div>
                      
                      <KorenThankYou />
                      
                      <div className="heart-explosion-container">
                        <Button 
                          onClick={() => {
                            trackModalComplete('nishmas-campaign');
                            markModalComplete('nishmas-campaign');
                            completeTask('tefilla');
                            setFullscreenContent({ isOpen: false, title: '', content: null });
                            
                            // Check if all tasks are completed and show congratulations
                            if (checkAndShowCongratulations()) {
                              openModal('congratulations', 'tefilla');
                            }
                          }}
                          className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                            isModalComplete('nishmas-campaign') 
                              ? 'bg-sage text-white hover:scale-105 transition-transform' 
                              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                          }`}
                        >
                          {isModalComplete('nishmas-campaign') ? 'Complete Again' : 'Complete'}
                        </Button>
                      </div>
                    </div>
                  )
                });
              }
            }}
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Open fullscreen"
          >
            <Expand className="h-4 w-4 text-gray-600" />
          </button>
          
          {/* Standardized Header with two-row layout */}
          <div className="mb-2 space-y-2">
            {/* First Row: Language Toggle and Title */}
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setNishmasLanguage(nishmasLanguage === 'hebrew' ? 'english' : 'hebrew')}
                variant="ghost"
                size="sm"
                className={`text-xs platypi-medium px-3 py-1 rounded-lg transition-all ${
                  nishmasLanguage === 'hebrew' 
                    ? 'bg-blush text-white' 
                    : 'text-black/60 hover:text-black hover:bg-white/50'
                }`}
              >
                {nishmasLanguage === 'hebrew' ? 'EN' : 'עב'}
              </Button>
              
              <DialogTitle className="text-lg platypi-bold text-black">Nishmas Kol Chai</DialogTitle>
            </div>
            
            {/* Second Row: Font Size Controls */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNishmasFontSize(Math.max(12, nishmasFontSize - 2))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs text-black/60 platypi-medium">{nishmasFontSize}px</span>
                <button
                  onClick={() => setNishmasFontSize(Math.min(28, nishmasFontSize + 2))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Standardized Content Area */}
          <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[50vh] overflow-y-auto">
            {nishmasLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div 
                className={`leading-relaxed text-black ${
                  nishmasLanguage === 'hebrew' ? 'vc-koren-hebrew' : 'koren-siddur-english text-left'
                }`} 
                style={{ fontSize: `${nishmasLanguage === 'hebrew' ? nishmasFontSize + 1 : nishmasFontSize}px` }}
              >
                {nishmasText ? (
                  <div 
                    className="whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: formatTextContent(
                        nishmasText.fullText || 'Text not available'
                      ).replace(/<strong>/g, nishmasLanguage === 'hebrew' ? '<strong class="vc-koren-hebrew-bold">' : '<strong style="font-weight: 700;">')
                    }}
                  />
                ) : (
                  <div className="text-red-600 text-center">Failed to load prayer text</div>
                )}
              </div>
            )}
          </div>

          {/* Expandable Information Section */}
          <div className="mb-1">
            <button
              onClick={() => setShowNishmasInfo(!showNishmasInfo)}
              className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-2xl p-3 border border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="platypi-medium text-black text-sm">Information</span>
                <span className="platypi-regular text-black/60 text-lg">
                  {showNishmasInfo ? '−' : '+'}
                </span>
              </div>
            </button>
            
            {showNishmasInfo && (
              <div className="bg-white rounded-2xl p-4 mt-2 border border-gray-200">
                <div className="platypi-regular leading-relaxed text-black/80 text-sm">
                  Rebbetzin Leah Kolodetsky shared that her mother, Rebbetzin Kanievsky zt"l, believed reciting Nishmas Kol Chai for 40 consecutive days is a powerful segulah for having prayers answered.
                </div>
              </div>
            )}
          </div>

          <NishmasThankYou />

          {/* Complete Button */}
          <div className="heart-explosion-container">
            <Button 
              onClick={() => completeWithAnimation()} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium mt-3 border-0"
            >
              Completed
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Refuah Prayers Modal */}
      <Dialog open={activeModal === 'refuah'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 platypi-regular" aria-describedby="refuah-description">
          <div id="refuah-description" className="sr-only">Prayers for healing and health</div>
          <div className="flex items-center justify-center mb-3 relative pr-8">
            <DialogTitle className="text-lg platypi-bold text-black">Refuah Prayers</DialogTitle>
          </div>
          <RefuahPrayersList onPrayerSelect={handlePrayerSelect} />
        </DialogContent>
      </Dialog>
      {/* Family Prayers Modal */}
      <Dialog open={activeModal === 'family'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 platypi-regular" aria-describedby="family-description">
          <div id="family-description" className="sr-only">Prayers for family harmony and blessings</div>
          <div className="flex items-center justify-center mb-3 relative pr-8">
            <DialogTitle className="text-lg platypi-bold text-black">Family Prayers</DialogTitle>
          </div>
          <FamilyPrayersList onPrayerSelect={handlePrayerSelect} />
        </DialogContent>
      </Dialog>
      {/* Life Prayers Modal */}
      <Dialog open={activeModal === 'life'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 platypi-regular" aria-describedby="life-description">
          <div id="life-description" className="sr-only">Prayers for life events and milestones</div>
          <div className="flex items-center justify-center mb-3 relative pr-8">
            <DialogTitle className="text-lg platypi-bold text-black">Life Prayers</DialogTitle>
          </div>
          <LifePrayersList onPrayerSelect={handlePrayerSelect} />
        </DialogContent>
      </Dialog>
      {/* Individual Prayer Modal */}
      <Dialog open={activeModal === 'individual-prayer'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="individual-prayer-description">
          <div id="individual-prayer-description" className="sr-only">Individual prayer text and translation</div>
          <IndividualPrayerContent prayerId={selectedPrayerId} fontSize={fontSize} setFontSize={setFontSize} />
        </DialogContent>
      </Dialog>

      {/* Special Tehillim Modal */}
      <Dialog open={activeModal === 'special-tehillim'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
          <SpecialTehillimModal />
        </DialogContent>
      </Dialog>

      {/* Individual Tehillim Modal */}
      <Dialog open={activeModal === 'individual-tehillim'} onOpenChange={(open) => {
        if (!open) {
          // When closing individual Tehillim, return to the special-tehillim modal
          openModal('special-tehillim', 'tefilla');
        }
      }}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
          <IndividualTehillimModal setFullscreenContent={setFullscreenContent} />
        </DialogContent>
      </Dialog>



      {/* Maariv Modal - Redirect directly to fullscreen */}
      <Dialog open={false} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="maariv-description">
          <div id="maariv-description" className="sr-only">Evening prayer service and instructions</div>
          
          {/* Fullscreen button */}
          <button
            onClick={() => {
              setFullscreenContent({
                isOpen: true,
                title: 'Maariv Prayer',
                content: (
                  <div className="space-y-6">
                    {maarivPrayers.map((prayer) => (
                      <div key={prayer.id} className="border-b border-warm-gray/10 pb-4 last:border-b-0">
                        {prayer.hebrewText && language === 'hebrew' && (
                          <div 
                            className="vc-koren-hebrew leading-relaxed"
                            style={{ fontSize: `${fontSize + 1}px` }}
                            dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.hebrewText, tefillaConditions).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
                          />
                        )}
                        {language === 'english' && (
                          <div 
                            className="koren-siddur-english text-left leading-relaxed text-black/70"
                            style={{ fontSize: `${fontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.englishTranslation || "English translation not available", tefillaConditions) }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )
              });
            }}
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Open fullscreen"
          >
            <Expand className="h-4 w-4 text-gray-600" />
          </button>
          
          <div className="mb-2 space-y-2">
            {/* First Row: Language Toggle, Title, and Info Icon */}
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() => setLanguage(language === 'hebrew' ? 'english' : 'hebrew')}
                variant="ghost"
                size="sm"
                className={`text-xs platypi-medium px-3 py-1 rounded-lg transition-all ${
                  language === 'hebrew'
                    ? 'bg-blush text-white' 
                    : 'text-black/60 hover:text-black hover:bg-white/50'
                }`}
              >
                {language === 'hebrew' ? 'EN' : 'עב'}
              </Button>
              
              <DialogTitle className="text-lg platypi-bold text-black">Maariv Prayer</DialogTitle>
              
              {/* Info Icon with Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="ml-1 p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <Info className="h-4 w-4 text-gray-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3">
                  {jewishTimesQuery.data ? (
                    <p className="text-xs text-black">
                      In a case of pressing need, Maariv can be recited from {jewishTimesQuery.data.plagHamincha} if, and only if, Mincha was recited that day before {jewishTimesQuery.data.plagHamincha}. In a case of pressing need, Maariv may be davened until {jewishTimesQuery.data.alosHashachar} (instead of Chatzos Haleiyla {jewishTimesQuery.data.chatzos}) of the next day.
                    </p>
                  ) : (
                    <p className="text-xs text-black">Loading timing information...</p>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Second Row: Font Size Controls */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <span className="text-xs platypi-medium">-</span>
                </button>
                <span className="text-xs platypi-medium text-black/70 w-6 text-center">{fontSize}</span>
                <button
                  onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <span className="text-xs platypi-medium">+</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[50vh] overflow-y-auto">
            {isMaarivLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {maarivPrayers.map((prayer) => (
                  <div key={prayer.id} className="border-b border-warm-gray/10 pb-4 last:border-b-0">
                    {prayer.hebrewText && language === 'hebrew' && (
                      <div 
                        className="vc-koren-hebrew leading-relaxed"
                        style={{ fontSize: `${fontSize + 1}px` }}
                        dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.hebrewText, tefillaConditions).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
                      />
                    )}
                    {language === 'english' && (
                      <div 
                        className="koren-siddur-english text-left leading-relaxed text-black/70"
                        style={{ fontSize: `${fontSize}px` }}
                        dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.englishTranslation || "English translation not available", tefillaConditions) }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <KorenThankYou />

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('maariv') ? undefined : () => completeWithAnimation()}
              disabled={isModalComplete('maariv')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('maariv') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('maariv') ? 'Completed Today' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Maariv FullscreenModal */}
      <FullscreenModal
        isOpen={activeModal === 'maariv'}
        onClose={() => closeModal(true)}
        title="Maariv Prayer"
        showFontControls={true}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        showLanguageControls={true}
        language={language}
        onLanguageChange={setLanguage}
        showInfoIcon={true}
        showInfoPopover={showMaarivInfo}
        onInfoClick={setShowMaarivInfo}
        infoContent={getMaarivTooltip()}
        showCompassButton={true}
      >
        <MaarivFullscreenContent language={language} fontSize={fontSize} />
      </FullscreenModal>

      {/* Morning Brochas Modal */}
      <MorningBrochasModal 
        setFullscreenContent={setFullscreenContent} 
        language={language}
        setLanguage={setLanguage}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />
      
      {/* Birkat Hamazon Modal */}
      <BirkatHamazonModal />
      
      {/* Jerusalem Compass - Removed modal, now using fullscreen */}

      {/* Fullscreen Modal */}
      <FullscreenModal
        isOpen={fullscreenContent.isOpen}
        onClose={() => setFullscreenContent({ isOpen: false, title: '', content: null })}
        title={fullscreenContent.title}
        showFontControls={fullscreenContent.contentType !== 'special-tehillim' && fullscreenContent.contentType !== 'brochas' && fullscreenContent.contentType !== 'compass'}
        showLanguageControls={
          fullscreenContent.contentType !== 'special-tehillim' && 
          fullscreenContent.contentType !== 'brochas' &&
          fullscreenContent.contentType !== 'compass' &&
          (fullscreenContent.contentType !== 'individual-prayer' || fullscreenContent.hasTranslation !== false)
        }
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        language={language}
        onLanguageChange={setLanguage}
        showInfoIcon={fullscreenContent.contentType === 'morning-brochas' || fullscreenContent.title === 'Maariv Prayer'}
        showInfoPopover={
          fullscreenContent.contentType === 'morning-brochas' ? showMorningBrochasInfo :
          fullscreenContent.title === 'Maariv Prayer' ? showMaarivInfo : false
        }
        onInfoClick={
          fullscreenContent.contentType === 'morning-brochas' 
            ? (open: boolean) => setShowMorningBrochasInfo(open)
            : fullscreenContent.title === 'Maariv Prayer' 
            ? (open: boolean) => setShowMaarivInfo(open)
            : () => {}
        }
        infoContent={
          fullscreenContent.contentType === 'morning-brochas' ? getMorningBrochasTooltip() :
          fullscreenContent.title === 'Maariv Prayer' ? getMaarivTooltip() : undefined
        }
        showCompassButton={fullscreenContent.contentType === 'morning-brochas' || fullscreenContent.contentType === 'mincha' || fullscreenContent.contentType === 'maariv'}
        floatingElement={fullscreenContent.contentType === 'morning-brochas' ? <MorningBrochasNavigationArrow /> : undefined}
      >
        {fullscreenContent.content || renderPrayerContent(fullscreenContent.contentType, language, fontSize)}
      </FullscreenModal>
    </>
  );
}

// Helper components for prayer modals

// Helper components for prayer lists
function RefuahPrayersList({ onPrayerSelect }: { onPrayerSelect: (id: number) => void }) {
  const { closeModal } = useModalStore();
  const { data: prayers, isLoading } = useQuery<WomensPrayer[]>({
    queryKey: ['/api/womens-prayers/refuah'],
  });

  if (isLoading) return <div className="text-center">Loading prayers...</div>;
  if (!prayers || prayers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 platypi-regular">No prayers available</p>
        <Button 
          onClick={() => closeModal()}
          className="w-full py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform mt-4"
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prayers.map((prayer) => (
        <div 
          key={prayer.id}
          className="bg-white rounded-xl p-4 cursor-pointer hover:bg-white/90 transition-all duration-300 shadow-sm border border-blush/20"
          onClick={() => {

            onPrayerSelect(prayer.id);
          }}
        >
          <div className="flex items-center space-x-3">
            <Stethoscope className="text-red-500" size={20} />
            <div>
              <span className="platypi-medium">{prayer.prayerName}</span>
              {prayer.description && (
                <p className="text-xs text-warm-gray/60 mt-1">{prayer.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <div className="mt-6">
        <Button 
          onClick={() => closeModal()}
          className="w-full py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

function FamilyPrayersList({ onPrayerSelect }: { onPrayerSelect: (id: number) => void }) {
  const { closeModal } = useModalStore();
  const { data: prayers, isLoading } = useQuery<WomensPrayer[]>({
    queryKey: ['/api/womens-prayers/family'],
  });

  if (isLoading) return <div className="text-center">Loading prayers...</div>;
  if (!prayers || prayers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 platypi-regular">No prayers available</p>
        <Button 
          onClick={() => closeModal()}
          className="w-full py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform mt-4"
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prayers.map((prayer) => (
        <div 
          key={prayer.id}
          className="bg-white rounded-xl p-4 cursor-pointer hover:bg-white/90 transition-all duration-300 shadow-sm border border-blush/20"
          onClick={() => onPrayerSelect(prayer.id)}
        >
          <div className="flex items-center space-x-3">
            <Users className="text-purple-500" size={20} />
            <div>
              <span className="platypi-medium">{prayer.prayerName}</span>
              {prayer.description && (
                <p className="text-xs text-warm-gray/60 mt-1">{prayer.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <div className="mt-6">
        <Button 
          onClick={() => closeModal()}
          className="w-full py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

function LifePrayersList({ onPrayerSelect }: { onPrayerSelect: (id: number) => void }) {
  const { closeModal } = useModalStore();
  const { data: prayers, isLoading } = useQuery<WomensPrayer[]>({
    queryKey: ['/api/womens-prayers/life'],
  });

  if (isLoading) return <div className="text-center">Loading prayers...</div>;
  if (!prayers || prayers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 platypi-regular">No prayers available</p>
        <Button 
          onClick={() => closeModal()}
          className="w-full py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform mt-4"
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prayers.map((prayer) => (
        <div 
          key={prayer.id}
          className="bg-white rounded-xl p-4 cursor-pointer hover:bg-white/90 transition-all duration-300 shadow-sm border border-blush/20"
          onClick={() => onPrayerSelect(prayer.id)}
        >
          <div className="flex items-center space-x-3">
            <Heart className="text-pink-500" size={20} />
            <div>
              <span className="platypi-medium">{prayer.prayerName}</span>
              {prayer.description && (
                <p className="text-xs text-warm-gray/60 mt-1">{prayer.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <div className="mt-6">
        <Button 
          onClick={() => closeModal()}
          className="w-full py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

function IndividualPrayerContent({ prayerId, fontSize, setFontSize }: {
  prayerId: number | null;
  fontSize: number;
  setFontSize: (size: number) => void;
}) {
  const { closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [language, setLanguage] = useState<"hebrew" | "english">("hebrew");
  
  // Load Tefilla conditions for conditional content processing
  const tefillaConditions = useTefillaConditions();
  
  const { data: prayer, isLoading } = useQuery<WomensPrayer>({
    queryKey: [`/api/womens-prayers/prayer/${prayerId}`],
    enabled: !!prayerId,
  });

  if (isLoading) return <div className="text-center">Loading prayer...</div>;
  if (!prayer) return <div className="text-center">Prayer not found</div>;
  
  // Use unique key per prayer for proper individual tracking
  const modalKey = `womens-prayer-${prayer?.id || prayerId}`;

  return (
    <>
      <VisuallyHidden>
        <DialogTitle>{prayer.prayerName}</DialogTitle>
      </VisuallyHidden>
      
      {/* Standardized Header with two-row layout */}
      <div className="mb-2 space-y-2">
        {/* First Row: Language Toggle and Title */}
        <div className="flex items-center justify-center gap-4">
          {/* Conditional translate button - only show if English text exists */}
          {prayer.englishTranslation && prayer.englishTranslation.trim() !== '' && prayer.englishTranslation !== 'English translation not available' && (
            <Button
              onClick={() => setLanguage(language === 'hebrew' ? 'english' : 'hebrew')}
              variant="ghost"
              size="sm"
              className={`text-xs platypi-medium px-3 py-1 rounded-lg transition-all ${
                language === 'hebrew' 
                  ? 'bg-blush text-white' 
                  : 'text-black/60 hover:text-black hover:bg-white/50'
              }`}
            >
              {language === 'hebrew' ? 'EN' : 'עב'}
            </Button>
          )}
          
          <h2 className="text-lg platypi-bold text-black">{prayer.prayerName}</h2>
        </div>
        
        {/* Second Row: Font Size Controls */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs text-black/60 platypi-medium">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Standardized Content Area */}
      <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[50vh] overflow-y-auto">
        {language === 'hebrew' ? (
          <div
            className="vc-koren-hebrew leading-relaxed text-black"
            style={{ fontSize: `${fontSize + 1}px` }}
            dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.hebrewText || '', tefillaConditions).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
          />
        ) : (
          <div
            className="koren-siddur-english text-left leading-relaxed text-black/70"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: processTefillaContent(prayer.englishTranslation || 'English translation not available', tefillaConditions) }}
          />
        )}
      </div>

      {/* Conditional attribution based on prayer name and ID */}
      {prayer.prayerName !== "Parshat Hamann" && prayer.prayerName !== "Hafrashas Challah" && prayer.id !== 10 && (
        <ChuppahThankYou />
      )}

      <div className="heart-explosion-container">
        <Button 
          onClick={() => {
            // Track modal completion and mark as completed globally
            trackModalComplete(modalKey);
            markModalComplete(modalKey);
            
            completeTask('tefilla');
            setShowHeartExplosion(true);
            
            setTimeout(() => {
              setShowHeartExplosion(false); // Reset explosion state
              
              // Check if all tasks are completed and show congratulations
              if (checkAndShowCongratulations()) {
                openModal('congratulations', 'tefilla');
              } else {
                closeModal();
                window.location.hash = '#/?section=home&scrollToProgress=true';
              }
            }, 2000);
          }}
          className={`w-full py-3 rounded-xl platypi-medium border-0 ${
            isModalComplete(modalKey) 
              ? 'bg-sage text-white hover:scale-105 transition-transform' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
        >
          {isModalComplete(modalKey) ? 'Complete Again' : 'Complete'}
        </Button>
        
        {/* Heart Explosion Animation */}
        <HeartExplosion 
          trigger={showHeartExplosion}
          onComplete={() => setShowHeartExplosion(false)} 
        />
      </div>


    </>
  );
}

// Special Tehillim Fullscreen Content Component
function SpecialTehillimFullscreenContent({ language: _language, fontSize: _fontSize }: { language: 'hebrew' | 'english'; fontSize: number }) {
  const { setSelectedPsalm, tehillimActiveTab, setTehillimActiveTab, setTehillimReturnTab, setDailyTehillimPsalms } = useModalStore();
  const { isModalComplete } = useModalCompletionStore();

  // Fetch current Hebrew date
  const today = new Date().toISOString().split('T')[0];
  const { data: hebrewDateInfo } = useQuery<{
    hebrew: string;
    date: string;
    isRoshChodesh: boolean;
    events: string[];
    hebrewDay: number;
    hebrewMonth: string;
    hebrewYear: number;
    monthLength: number;
    dd: number;
    hm: string;
  }>({
    queryKey: ['/api/hebrew-date', today],
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Helper function to get daily Tehillim based on Hebrew date
  const getDailyTehillim = (): { psalms: number[]; title: string; subtitle: string } | null => {
    if (!hebrewDateInfo) return null;
    
    const hebrewDay = hebrewDateInfo.dd || hebrewDateInfo.hebrewDay || 0;
    const hebrewDate = hebrewDateInfo.hebrew || '';
    
    // Determine if current month has only 29 days
    const monthLength = hebrewDateInfo.monthLength || 30;
    const isShortMonth = monthLength === 29;
    
    let psalmsToShow: number[] = [];
    let subtitle = `${hebrewDate}`;
    
    if (isShortMonth && hebrewDay === 29) {
      // On day 29 of a 29-day month, show both day 29 and day 30 Tehillim
      psalmsToShow = [...(DAILY_TEHILLIM_SCHEDULE[29] || []), ...(DAILY_TEHILLIM_SCHEDULE[30] || [])];
      subtitle = `${hebrewDate} (29-day month)`;
    } else {
      // Normal case: show Tehillim for the current day
      psalmsToShow = DAILY_TEHILLIM_SCHEDULE[hebrewDay] || [];
    }
    
    return {
      psalms: psalmsToShow,
      title: "Today's Tehillim",
      subtitle
    };
  };

  const dailyTehillim = getDailyTehillim();

  // Open individual Tehillim text
  const openTehillimText = (psalmNumber: number, fromDaily = false) => {
    // Store the current tab so we can return to it after completion

    setTehillimReturnTab(tehillimActiveTab); // Store in Zustand instead of localStorage
    setSelectedPsalm(psalmNumber);
    
    // Clear daily tehillim list if not from Daily Tehillim
    if (!fromDaily) {
      setDailyTehillimPsalms(null);
    }
    
    // Directly switch to individual Tehillim content without modal transitions
    const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
      detail: {
        title: `Tehillim ${psalmNumber}`,
        contentType: 'individual-tehillim',
        returnTab: tehillimActiveTab // Pass the current tab in the event detail
      }
    });
    window.dispatchEvent(fullscreenEvent);
  };

  // Generate array of all 150 psalms
  const allPsalms = Array.from({ length: 150 }, (_, i) => i + 1);

  // Special categories with psalm numbers
  const specialCategories = [
    { title: "Bris milah", psalms: [12] },
    { title: "Cemetery", psalms: [33, 16, 17, 72, 91, 104, 130, 119] },
    { title: "Children's success", psalms: [127, 128] },
    { title: "Finding a mate", psalms: [32, 38, 70, 71, 121, 124] },
    { title: "For having children", psalms: [102, 103, 128] },
    { title: "Forgiveness", psalms: [25] },
    { title: "Giving birth", psalms: [20, 139] },
    { title: "Gratitude", psalms: [9, 17, 18, 21, 23, 33, 42, 57, 63, 65, 68, 71, 72, 95, 100, 103, 104, 105, 107, 108, 116, 124, 136, 138, 145, 146, 147, 148, 149, 150] },
    { title: "Graves of righteous", psalms: [16, 17, 20, 23] },
    { title: "Guidance", psalms: [16, 19, 139] },
    { title: "Heavenly mercy", psalms: [89, 98, 107] },
    { title: "House of mourning", psalms: [49] },
    { title: "Illness", psalms: [6, 30, 41, 88, 103] },
    { title: "Jerusalem", psalms: [87, 122, 125, 137] },
    { title: "Land of Israel", psalms: [74, 79, 80, 83, 102, 127, 130, 136, 142] },
    { title: "Longevity", psalms: [23, 90, 92] },
    { title: "Wedding day", psalms: [19, 33, 45, 49, 128] },
    { title: "Peace", psalms: [46, 98, 120] },
    { title: "Protection from harm", psalms: [3, 5, 7, 20, 23, 27, 31, 35, 40, 48, 55, 59, 69, 70, 91, 109, 119, 121] },
    { title: "Redemption, Rebuilding of Temple", psalms: [42, 43, 84, 96, 132, 138] },
    { title: "Repentance", psalms: [25, 32, 47, 51, 90] },
    { title: "Success", psalms: [4, 57, 108, 112, 122] },
    { title: "Sustenance", psalms: [4, 24, 41] },
    { title: "Times of trouble", psalms: [16, 20, 22, 25, 26, 38, 54, 81, 85, 86, 87, 102] },
    { title: "Torah study", psalms: [1, 19, 119, 134] },
    { title: "Travel", psalms: [17, 91] }
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex bg-blush/20 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTehillimActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            tehillimActiveTab === 'all'
              ? 'bg-white text-black shadow-md border border-blush/30'
              : 'text-black/50 hover:text-black/70'
          }`}
        >
          Sefer Tehillim
        </button>
        <button
          onClick={() => setTehillimActiveTab('special')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            tehillimActiveTab === 'special'
              ? 'bg-white text-black shadow-md border border-blush/30'
              : 'text-black/50 hover:text-black/70'
          }`}
        >
          Special Occasions
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {tehillimActiveTab === 'all' ? (
          <div className="bg-white/80 rounded-2xl p-3 border border-blush/10">
            <div className="grid grid-cols-6 gap-2 overflow-hidden tehillim-button-grid">
              {allPsalms.map((psalm) => (
                <button
                  key={psalm}
                  onClick={() => openTehillimText(psalm)}
                  className={`w-11 h-11 rounded-lg text-sm platypi-medium hover:opacity-90 transition-opacity flex items-center justify-center flex-shrink-0 ${
                    isModalComplete(`individual-tehillim-${psalm}`)
                      ? 'bg-sage text-white'
                      : 'bg-gradient-feminine text-white'
                  } ${psalm === 27 ? 'tehillim-27-pulse' : ''}`}
                  style={{ touchAction: 'manipulation' }}
                >
                  {psalm}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Daily Tehillim Section - Always at the top */}
            {dailyTehillim && dailyTehillim.psalms.length > 0 && (
              <div className="bg-white/80 rounded-2xl p-4 border border-blush/10 shadow-sm complete-button-pulse">
                <h3 className="platypi-bold text-base text-black mb-3">{dailyTehillim.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {dailyTehillim.psalms.map((psalm) => (
                    <button
                      key={psalm}
                      onClick={() => {
                        // Set daily tehillim list for Complete & Next functionality
                        setDailyTehillimPsalms(dailyTehillim.psalms);
                        openTehillimText(psalm, true);
                      }}
                      className={`w-11 h-11 rounded-lg text-sm platypi-medium hover:opacity-90 transition-opacity flex items-center justify-center ${
                        isModalComplete(`individual-tehillim-${psalm}`)
                          ? 'bg-sage text-white'
                          : 'bg-gradient-feminine text-white'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {psalm}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Special Occasions Categories */}
            {specialCategories.map((category, index) => (
              <div key={index} className="bg-white/80 rounded-2xl p-3 border border-blush/10">
                <h3 className="platypi-bold text-sm text-black mb-2">{category.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {category.psalms.map((psalm) => (
                    <button
                      key={psalm}
                      onClick={() => openTehillimText(psalm)}
                      className={`w-11 h-11 rounded-lg text-sm platypi-medium hover:opacity-90 transition-opacity flex items-center justify-center ${
                        isModalComplete(`individual-tehillim-${psalm}`)
                          ? 'bg-sage text-white'
                          : 'bg-gradient-feminine text-white'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {psalm}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <KorenThankYou />

      <Button 
        onClick={() => {
          window.dispatchEvent(new Event('closeFullscreen'));
        }} 
        className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 mt-4"
      >
        Close
      </Button>
    </div>
  );
}

// Daily Tehillim schedule by Hebrew calendar day
const DAILY_TEHILLIM_SCHEDULE: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  2: [10, 11, 12, 13, 14, 15, 16, 17],
  3: [18, 19, 20, 21, 22],
  4: [23, 24, 25, 26, 27, 28],
  5: [29, 30, 31, 32, 33, 34],
  6: [35, 36, 37, 38],
  7: [39, 40, 41, 42, 43],
  8: [44, 45, 46, 47, 48],
  9: [49, 50, 51, 52, 53, 54],
  10: [55, 56, 57, 58, 59],
  11: [60, 61, 62, 63, 64, 65],
  12: [66, 67, 68],
  13: [69, 70, 71],
  14: [72, 73, 74, 75, 76],
  15: [77, 78],
  16: [79, 80, 81, 82],
  17: [83, 84, 85, 86, 87],
  18: [88, 89],
  19: [90, 91, 92, 93, 94, 95, 96],
  20: [97, 98, 99, 100, 101, 102, 103],
  21: [104, 105],
  22: [106, 107],
  23: [108, 109, 110, 111, 112],
  24: [113, 114, 115, 116, 117, 118],
  25: [119], // Tehillim 119 parts 1-12 (handled specially)
  26: [119], // Tehillim 119 parts 13-22 (handled specially)
  27: [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134],
  28: [135, 136, 137, 138, 139],
  29: [140, 141, 142, 143, 144],
  30: [145, 146, 147, 148, 149, 150]
};

// Tehillim Modal Component (previously Special Tehillim)
function SpecialTehillimModal() {
  const { closeModal, openModal, setSelectedPsalm, tehillimActiveTab, setTehillimActiveTab } = useModalStore();
  const { isModalComplete } = useModalCompletionStore();

  // Fetch current Hebrew date
  const today = new Date().toISOString().split('T')[0];
  const { data: hebrewDateInfo } = useQuery<{
    hebrew: string;
    date: string;
    isRoshChodesh: boolean;
    events: string[];
    hebrewDay: number;
    hebrewMonth: string;
    hebrewYear: number;
    monthLength: number;
    dd: number;
    hm: string;
  }>({
    queryKey: ['/api/hebrew-date', today],
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Helper function to get daily Tehillim based on Hebrew date
  const getDailyTehillim = (): { psalms: number[]; title: string; subtitle: string } | null => {
    if (!hebrewDateInfo) return null;
    
    const hebrewDay = hebrewDateInfo.dd || hebrewDateInfo.hebrewDay || 0;
    const hebrewDate = hebrewDateInfo.hebrew || '';
    
    // Determine if current month has only 29 days
    // In the Hebrew calendar, some months (like Cheshvan and Kislev) can have 29 or 30 days
    const monthLength = hebrewDateInfo.monthLength || 30;
    const isShortMonth = monthLength === 29;
    
    let psalmsToShow: number[] = [];
    let subtitle = `${hebrewDate}`;
    
    if (isShortMonth && hebrewDay === 29) {
      // On day 29 of a 29-day month, show both day 29 and day 30 Tehillim
      psalmsToShow = [...(DAILY_TEHILLIM_SCHEDULE[29] || []), ...(DAILY_TEHILLIM_SCHEDULE[30] || [])];
      subtitle = `${hebrewDate} (29-day month)`;
    } else {
      // Normal case: show Tehillim for the current day
      psalmsToShow = DAILY_TEHILLIM_SCHEDULE[hebrewDay] || [];
    }
    
    return {
      psalms: psalmsToShow,
      title: "Today's Tehillim",
      subtitle
    };
  };

  const dailyTehillim = getDailyTehillim();

  // Open individual Tehillim text
  const openTehillimText = (psalmNumber: number) => {
    // Remember the current tab before navigating to individual Tehillim
    setTehillimActiveTab(tehillimActiveTab);
    setSelectedPsalm(psalmNumber);
    closeModal();
    openModal('individual-tehillim', 'tefilla', psalmNumber);
  };

  // Generate array of all 150 psalms
  const allPsalms = Array.from({ length: 150 }, (_, i) => i + 1);

  // Special categories with psalm numbers
  const specialCategories = [
    { title: "Bris milah", psalms: [12] },
    { title: "Cemetery", psalms: [33, 16, 17, 72, 91, 104, 130, 119] },
    { title: "Children's success", psalms: [127, 128] },
    { title: "Finding a mate", psalms: [32, 38, 70, 71, 121, 124] },
    { title: "For having children", psalms: [102, 103, 128] },
    { title: "Forgiveness", psalms: [25] },
    { title: "Giving birth", psalms: [20, 139] },
    { title: "Gratitude", psalms: [9, 17, 18, 21, 23, 33, 42, 57, 63, 65, 68, 71, 72, 95, 100, 103, 104, 105, 107, 108, 116, 124, 136, 138, 145, 146, 147, 148, 149, 150] },
    { title: "Graves of righteous", psalms: [16, 17, 20, 23] },
    { title: "Guidance", psalms: [16, 19, 139] },
    { title: "Heavenly mercy", psalms: [89, 98, 107] },
    { title: "House of mourning", psalms: [49] },
    { title: "Illness", psalms: [6, 30, 41, 88, 103] },
    { title: "Jerusalem", psalms: [87, 122, 125, 137] },
    { title: "Land of Israel", psalms: [74, 79, 80, 83, 102, 127, 130, 136, 142] },
    { title: "Longevity", psalms: [23, 90, 92] },
    { title: "Wedding day", psalms: [19, 33, 45, 49, 128] },
    { title: "Peace", psalms: [46, 98, 120] },
    { title: "Protection from harm", psalms: [3, 5, 7, 20, 23, 27, 31, 35, 40, 48, 55, 59, 69, 70, 91, 109, 119, 121] },
    { title: "Redemption, Rebuilding of Temple", psalms: [42, 43, 84, 96, 132, 138] },
    { title: "Repentance", psalms: [25, 32, 47, 51, 90] },
    { title: "Success", psalms: [4, 57, 108, 112, 122] },
    { title: "Sustenance", psalms: [4, 24, 41] },
    { title: "Times of trouble", psalms: [16, 20, 22, 25, 26, 38, 54, 81, 85, 86, 87, 102] },
    { title: "Torah study", psalms: [1, 19, 119, 134] },
    { title: "Travel", psalms: [17, 91] }
  ];

  return (
    <>
      <DialogHeader className="text-center mb-4">
        <DialogTitle className="text-lg platypi-semibold text-black">Tehillim</DialogTitle>
      </DialogHeader>

      {/* Tab Navigation */}
      <div className="flex bg-blush/20 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTehillimActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            tehillimActiveTab === 'all'
              ? 'bg-white text-black shadow-md border border-blush/30'
              : 'text-black/50 hover:text-black/70'
          }`}
        >
          Sefer Tehillim
        </button>
        <button
          onClick={() => setTehillimActiveTab('special')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            tehillimActiveTab === 'special'
              ? 'bg-white text-black shadow-md border border-blush/30'
              : 'text-black/50 hover:text-black/70'
          }`}
        >
          Special Occasions
        </button>
      </div>

      {/* Tab Content */}
      <div className="max-h-[50vh] overflow-y-auto">
        {tehillimActiveTab === 'all' ? (
          <div className="bg-white/80 rounded-2xl p-3 border border-blush/10">
            <div className="grid grid-cols-6 gap-2 overflow-hidden tehillim-button-grid">
              {allPsalms.map((psalm) => (
                <button
                  key={psalm}
                  onClick={() => openTehillimText(psalm)}
                  className={`w-11 h-11 rounded-lg text-sm platypi-medium hover:opacity-90 transition-opacity flex items-center justify-center flex-shrink-0 ${
                    isModalComplete(`individual-tehillim-${psalm}`)
                      ? 'bg-sage text-white'
                      : 'bg-gradient-feminine text-white'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  {psalm}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Daily Tehillim Section - Always at the top */}
            {dailyTehillim && dailyTehillim.psalms.length > 0 && (
              <div className="relative rounded-2xl p-[3px] daily-tehillim-border">
                <div className="bg-white rounded-2xl p-4">
                  <h3 className="platypi-bold text-base text-black mb-3">{dailyTehillim.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {dailyTehillim.psalms.map((psalm) => (
                      <button
                        key={psalm}
                        onClick={() => openTehillimText(psalm)}
                        className={`px-3 py-1 rounded-xl text-sm platypi-medium hover:opacity-90 transition-opacity text-white ${
                          isModalComplete(`individual-tehillim-${psalm}`)
                            ? 'bg-sage'
                            : 'bg-gradient-feminine'
                        }`}
                      >
                        {psalm}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Special Occasions Categories */}
            {specialCategories.map((category, index) => (
              <div key={index} className="bg-white/80 rounded-2xl p-3 border border-blush/10">
                <h3 className="platypi-bold text-sm text-black mb-2">{category.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {category.psalms.map((psalm) => (
                    <button
                      key={psalm}
                      onClick={() => openTehillimText(psalm)}
                      className={`px-3 py-1 rounded-xl text-sm platypi-medium hover:opacity-90 transition-opacity text-white ${
                        isModalComplete(`individual-tehillim-${psalm}`)
                          ? 'bg-sage'
                          : 'bg-gradient-feminine'
                      }`}
                    >
                      {psalm}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button 
        onClick={() => {
          closeModal();
        }} 
        className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 mt-4"
      >
        Close
      </Button>
    </>
  );
}


function IndividualTehillimModal({ setFullscreenContent }: { setFullscreenContent?: (content: any) => void }) {
  const { openModal, selectedPsalm, tehillimActiveTab, dailyTehillimPsalms } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [language, setLanguage] = useState<'hebrew' | 'english'>(() => {
    // Check for saved language preference for Tehillim
    const savedLang = localStorage.getItem('tehillim-language');
    return savedLang === 'english' ? 'english' : 'hebrew';
  });
  const [fontSize, setFontSize] = useState(20);
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const queryClient = useQueryClient();
  
  // Load Tefilla conditions for conditional content processing
  const tefillaConditions = useTefillaConditions();

  // Check if we're coming from the selector page (psalm number 1-150) or from global chain (ID > 150)
  // Psalms from selector are always 1-150, while global chain IDs for psalm 119 parts are > 150
  const isFromSelector = selectedPsalm && selectedPsalm <= 150;

  // First get tehillim info to check if this is a specific part (by ID) or full psalm (by English number)
  // Skip this check if coming from selector - always treat as full psalm
  const { data: tehillimInfo } = useQuery<{
    id: number;
    englishNumber: number;
    partNumber: number;
    hebrewNumber: string;
  }>({
    queryKey: ['/api/tehillim/info', selectedPsalm],
    queryFn: async () => {
      if (!selectedPsalm) return null;
      // If from selector, don't fetch info - we want the full psalm
      if (isFromSelector) return null;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/info/${selectedPsalm}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedPsalm && !isFromSelector, // Don't fetch info if from selector
    staleTime: 0
  });

  // Use by-id endpoint if we have tehillim info (meaning selectedPsalm is an ID from global chain)
  // Otherwise use English number endpoint (for selector page or when no info available)
  const { data: tehillimText, isLoading } = useQuery({
    queryKey: tehillimInfo ? ['/api/tehillim/text/by-id', selectedPsalm, language] : ['/api/tehillim/text', selectedPsalm, language],
    queryFn: async () => {
      if (tehillimInfo && !isFromSelector) {
        // This is a specific part from global chain - use by-id endpoint
        const response = await axiosClient.get(`/api/tehillim/text/by-id/${selectedPsalm}?language=${language}`);
        return response.data;
      } else {
        // This is a full psalm from selector - use English number endpoint
        const response = await axiosClient.get(`/api/tehillim/text/${selectedPsalm}?language=${language}`);
        return response.data;
      }
    },
    enabled: !!selectedPsalm,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });

  // Update fullscreen content when psalm or text changes (for "Complete & Next" navigation)
  useEffect(() => {
    if (setFullscreenContent && tehillimText && selectedPsalm) {
      // Check if fullscreen is already open and update content
      setFullscreenContent((current: any) => {
        if (current.isOpen && current.title?.includes('Tehillim')) {
          // Construct proper title
          let title = `Tehillim ${selectedPsalm}`;
          if (!isFromSelector && tehillimInfo) {
            // Only use tehillimInfo for global chain (parts)
            if (tehillimInfo.partNumber > 1) {
              title = `Tehillim ${tehillimInfo.englishNumber} Part ${tehillimInfo.partNumber}`;
            } else {
              title = `Tehillim ${tehillimInfo.englishNumber}`;
            }
          }
          // For selector pages, just use the psalm number directly
          
          return {
            isOpen: true,
            title: title,
            content: (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-blush/10">
                  <div
                    className={`${language === 'hebrew' ? 'vc-koren-hebrew' : 'koren-siddur-english text-left'} leading-relaxed text-black`}
                    style={{ fontSize: language === 'hebrew' ? `${fontSize + 1}px` : `${fontSize}px` }}
                    dangerouslySetInnerHTML={{
                      __html: processTefillaContent(tehillimText?.text || '', tefillaConditions)
                    }}
                  />
                </div>
                
                <KorenThankYou />
                
                <div className="heart-explosion-container">
                  {(() => {
                    // Check if from Daily Tehillim
                    const isFromDailyTehillim = dailyTehillimPsalms && dailyTehillimPsalms.includes(selectedPsalm || 0);
                    const currentIndex = isFromDailyTehillim ? dailyTehillimPsalms.indexOf(selectedPsalm || 0) : -1;
                    const hasNextDailyPsalm = isFromDailyTehillim && currentIndex >= 0 && currentIndex < dailyTehillimPsalms.length - 1;
                    const nextDailyPsalm = hasNextDailyPsalm ? dailyTehillimPsalms[currentIndex + 1] : null;
                    
                    // Determine if we should show Complete & Next button
                    const showCompleteAndNext = tehillimActiveTab === 'all' || hasNextDailyPsalm;
                    
                    return (
                      <div className={showCompleteAndNext ? 'flex gap-2' : ''}>
                        {/* Complete button */}
                        <Button 
                          onClick={() => {
                            trackModalComplete(`individual-tehillim-${selectedPsalm}`);
                            markModalComplete(`individual-tehillim-${selectedPsalm}`);
                            completeTask('tefilla');
                            setShowHeartExplosion(true);
                            
                            axiosClient.post('/api/tehillim/complete', {
                              currentPerek: selectedPsalm,
                              language: language,
                              completedBy: 'user'
                            }).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
                              queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
                            }).catch(() => {});
                            
                            setTimeout(() => {
                              setShowHeartExplosion(false);
                              setFullscreenContent({ isOpen: false, title: '', content: null });
                              
                              // Check if congratulations should be shown
                              if (checkAndShowCongratulations()) {
                                openModal('congratulations', 'tefilla');
                              } else {
                                // Only open special-tehillim if congratulations wasn't shown
                                openModal('special-tehillim', 'tefilla');
                              }
                            }, 400);
                          }}
                          className={`${showCompleteAndNext ? 'flex-1' : 'w-full'} py-3 rounded-xl platypi-medium border-0 ${
                            isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                              ? 'bg-sage text-white hover:scale-105 transition-transform' 
                              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                          }`}
                        >
                          {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Again' : 'Complete'}
                        </Button>
                        
                        {/* Complete and Next button - show for 1-150 tab OR Daily Tehillim with next psalm */}
                        {showCompleteAndNext && (
                          <Button 
                            onClick={() => {
                              trackModalComplete(`individual-tehillim-${selectedPsalm}`);
                              markModalComplete(`individual-tehillim-${selectedPsalm}`);
                              completeTask('tefilla');
                              
                              // Determine next psalm: from Daily Tehillim list or sequential
                              const nextPsalm = nextDailyPsalm || (selectedPsalm && selectedPsalm < 150 ? selectedPsalm + 1 : 1);
                              setShowHeartExplosion(true);
                              
                              axiosClient.post('/api/tehillim/complete', {
                                currentPerek: selectedPsalm,
                                language: language,
                                completedBy: 'user'
                              }).then(() => {
                                queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
                                queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
                              }).catch(() => {});
                              
                              setTimeout(() => {
                                setShowHeartExplosion(false);
                                openModal('individual-tehillim', 'tefilla', nextPsalm);
                              }, 400);
                            }}
                            className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
                              isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                                ? 'bg-sage text-white hover:scale-105 transition-transform' 
                                : 'bg-gradient-sage-to-blush text-white hover:scale-105 transition-transform complete-next-button-pulse'
                            }`}
                          >
                            {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Next' : 'Complete & Next'}
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Heart Explosion Animation */}
                <HeartExplosion 
                  trigger={showHeartExplosion}
                  onComplete={() => setShowHeartExplosion(false)} 
                />
              </div>
            )
          };
        }
        return current;
      });
    }
  }, [selectedPsalm, tehillimText, language, fontSize, tehillimActiveTab, setFullscreenContent, tehillimInfo, dailyTehillimPsalms, isModalComplete, markModalComplete, completeTask, trackModalComplete, queryClient, checkAndShowCongratulations, openModal]);

  return (
    <>
      {/* Fullscreen button */}
      {setFullscreenContent && tehillimText && (
        <button
          onClick={() => {
            // Construct proper title
            let title = `Tehillim ${selectedPsalm}`;
            if (!isFromSelector && tehillimInfo) {
              // Only use tehillimInfo for global chain (parts)
              if (tehillimInfo.partNumber > 1) {
                title = `Tehillim ${tehillimInfo.englishNumber} Part ${tehillimInfo.partNumber}`;
              } else {
                title = `Tehillim ${tehillimInfo.englishNumber}`;
              }
            }
            // For selector pages, just use the psalm number directly
            
            setFullscreenContent({
              isOpen: true,
              title: title,
              content: (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 border border-blush/10">
                    <div
                      className={`${language === 'hebrew' ? 'vc-koren-hebrew' : 'koren-siddur-english text-left'} leading-relaxed text-black`}
                      style={{ fontSize: language === 'hebrew' ? `${fontSize + 1}px` : `${fontSize}px` }}
                      dangerouslySetInnerHTML={{
                        __html: processTefillaContent(tehillimText?.text || '', tefillaConditions)
                      }}
                    />
                  </div>
                  
                  <KorenThankYou />
                  
                  <div className="heart-explosion-container">
                    <div className={tehillimActiveTab === 'all' ? 'flex gap-2' : ''}>
                      {/* Complete button - returns to Tehillim selector */}
                      <Button 
                        onClick={() => {
                          // Track modal completion immediately
                          trackModalComplete(`individual-tehillim-${selectedPsalm}`);
                          markModalComplete(`individual-tehillim-${selectedPsalm}`);
                          completeTask('tefilla');
                          setShowHeartExplosion(true);
                          
                          // Update global progress in background without waiting
                          axiosClient.post('/api/tehillim/complete', {
                            currentPerek: selectedPsalm,
                            language: language,
                            completedBy: 'user'
                          }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
                            queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
                          }).catch(() => {
                            // Silently handle errors - local completion is already done
                          });
                          
                          setTimeout(() => {
                            setShowHeartExplosion(false);
                            setFullscreenContent({ isOpen: false, title: '', content: null });
                            openModal('special-tehillim', 'tefilla');
                          }, 400);
                        }}
                        className={`${tehillimActiveTab === 'all' ? 'flex-1' : 'w-full'} py-3 rounded-xl platypi-medium border-0 ${
                          isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                            ? 'bg-sage text-white hover:scale-105 transition-transform' 
                            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                        }`}
                      >
                        {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Again' : 'Complete'}
                      </Button>
                      
                      {/* Complete and Next button - only show when coming from 1-150 tab */}
                      {tehillimActiveTab === 'all' && (
                        <Button 
                          onClick={() => {
                            // Track modal completion immediately
                            trackModalComplete(`individual-tehillim-${selectedPsalm}`);
                            markModalComplete(`individual-tehillim-${selectedPsalm}`);
                            completeTask('tefilla');
                            const nextPsalm = selectedPsalm && selectedPsalm < 150 ? selectedPsalm + 1 : 1;
                            setShowHeartExplosion(true);
                            
                            // Update global progress in background without waiting
                            axiosClient.post('/api/tehillim/complete', {
                              currentPerek: selectedPsalm,
                              language: language,
                              completedBy: 'user'
                            }).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
                              queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
                            }).catch(() => {
                              // Silently handle errors - local completion is already done
                            });
                            
                            setTimeout(() => {
                              setShowHeartExplosion(false);
                              
                              // Check if congratulations should be shown
                              if (checkAndShowCongratulations()) {
                                openModal('congratulations', 'tefilla');
                              } else {
                                // Only navigate to next psalm if congratulations wasn't shown
                                openModal('individual-tehillim', 'tefilla', nextPsalm);
                              }
                            }, 400);
                          }}
                          className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
                            isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                              ? 'bg-sage text-white hover:scale-105 transition-transform' 
                              : 'bg-gradient-sage-to-blush text-white hover:scale-105 transition-transform complete-next-button-pulse'
                          }`}
                        >
                          {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Next' : 'Complete & Next'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            });
          }}
          className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
          aria-label="Open fullscreen"
        >
          <Expand className="h-4 w-4 text-gray-600" />
        </button>
      )}
      
      {/* Standardized Header */}
      <div className="mb-2 space-y-2">
        {/* First Row: Language Toggle and Title */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => {
              const newLanguage = language === 'hebrew' ? 'english' : 'hebrew';
              setLanguage(newLanguage);
              // Save language preference for Tehillim
              localStorage.setItem('tehillim-language', newLanguage);
            }}
            variant="ghost"
            size="sm"
            className={`text-xs platypi-medium px-3 py-1 rounded-lg transition-all ${
              language === 'hebrew' 
                ? 'bg-blush text-white' 
                : 'text-black/60 hover:text-black hover:bg-white/50'
            }`}
          >
            {language === 'hebrew' ? 'EN' : 'עב'}
          </Button>
          
          <DialogTitle className="text-lg platypi-bold text-black">Tehillim {selectedPsalm}</DialogTitle>
        </div>
        
        {/* Second Row: Font Size Controls */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs text-black/60 platypi-medium">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Standardized Content Area - Fixed scrolling */}
      <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[60vh] overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div
            className={`${language === 'hebrew' ? 'vc-koren-hebrew' : 'koren-siddur-english text-left'} leading-relaxed text-black pb-4`}
            style={{ 
              fontSize: `${language === 'hebrew' ? fontSize + 1 : fontSize}px`,
              minHeight: 'fit-content'
            }}
            dangerouslySetInnerHTML={{
              __html: processTefillaContent(tehillimText?.text || `Psalm ${selectedPsalm} text loading...`, tefillaConditions)
            }}
          />
        )}
      </div>

      <KorenThankYou />

      {/* Complete Buttons - Conditional based on which tab user came from */}
      <div className={tehillimActiveTab === 'all' ? 'flex gap-2' : ''}>
        {/* Complete button - returns to Tehillim selector */}
        <Button 
          onClick={() => {
            // Track modal completion immediately
            trackModalComplete(`individual-tehillim-${selectedPsalm}`);
            markModalComplete(`individual-tehillim-${selectedPsalm}`);
            completeTask('tefilla');
            setShowHeartExplosion(true);
            
            // Update global progress in background without waiting
            axiosClient.post('/api/tehillim/complete', {
              currentPerek: selectedPsalm,
              language: language,
              completedBy: 'user'
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
              queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
            }).catch(() => {
              // Silently handle errors - local completion is already done
            });
            
            setTimeout(() => {
              setShowHeartExplosion(false);
              
              // Check if congratulations should be shown
              if (checkAndShowCongratulations()) {
                openModal('congratulations', 'tefilla');
              } else {
                // Only open special-tehillim if congratulations wasn't shown
                openModal('special-tehillim', 'tefilla');
              }
            }, 400);
          }}
          className={`${tehillimActiveTab === 'all' ? 'flex-1' : 'w-full'} py-3 rounded-xl platypi-medium border-0 ${
            isModalComplete(`individual-tehillim-${selectedPsalm}`) 
              ? 'bg-sage text-white hover:scale-105 transition-transform' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
        >
          {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Again' : 'Complete'}
        </Button>

        {/* Complete and Next button - only show when coming from 1-150 tab */}
        {tehillimActiveTab === 'all' && (
          <Button 
            onClick={() => {
              // Track modal completion immediately
              trackModalComplete(`individual-tehillim-${selectedPsalm}`);
              markModalComplete(`individual-tehillim-${selectedPsalm}`);
              completeTask('tefilla');
              const nextPsalm = selectedPsalm ? Math.min(selectedPsalm + 1, 150) : 1;
              setShowHeartExplosion(true);
              
              // Update global progress in background without waiting
              axiosClient.post('/api/tehillim/complete', {
                currentPerek: selectedPsalm,
                language: language,
                completedBy: 'user'
              }).then(() => {
                queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
                queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
              }).catch(() => {
                // Silently handle errors - local completion is already done
              });
              
              setTimeout(() => {
                setShowHeartExplosion(false);
                
                // Check if congratulations should be shown
                if (checkAndShowCongratulations()) {
                  openModal('congratulations', 'tefilla');
                } else {
                  // Only navigate if congratulations wasn't shown
                  if (nextPsalm <= 150) {
                    openModal('individual-tehillim', 'special-tehillim', nextPsalm);
                  } else {
                    openModal('special-tehillim', 'tefilla');
                  }
                }
              }, 400);
            }}
            className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
              isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                ? 'bg-sage text-white hover:scale-105 transition-transform' 
                : 'bg-gradient-sage-to-blush text-white hover:scale-105 transition-transform complete-next-button-pulse'
            }`}
          >
            {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Next' : 'Complete & Next'}
          </Button>
        )}
      </div>
      
      {/* Heart Explosion Animation */}
      <HeartExplosion 
        trigger={showHeartExplosion}
        onComplete={() => setShowHeartExplosion(false)} 
      />
    </>
  );
}

export { BrochasFullscreenContent, IndividualBrochaFullscreenContent, TehillimFullscreenContent, MaarivFullscreenContent };

// Note: Old complex compass implementation removed in favor of simplified version
