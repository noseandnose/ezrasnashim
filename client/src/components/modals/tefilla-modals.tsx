import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { HandHeart, Scroll, Heart, Plus, Minus, Stethoscope, HeartHandshake, Baby, DollarSign, Star, Users, GraduationCap, Smile, Unlock, Check, Utensils, Wine, Car, Wheat, Moon, User, Info } from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

import { MinchaPrayer, MorningPrayer, NishmasText, GlobalTehillimProgress, TehillimName, WomensPrayer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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
import { createContext, useContext } from 'react';

// Import simplified compass component
import { SimpleCompassUI } from '@/components/compass/SimpleCompassUI';

// Context for Morning Brochas navigation arrow
const MorningBrochasNavigationContext = createContext<{
  expandedSection: number;
  scrollToBottomOfSection: () => void;
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
} | null>(null);

interface TefillaModalsProps {
  onSectionChange?: (section: 'torah' | 'tefilla' | 'tzedaka' | 'home' | 'table') => void;
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
        All tefilla texts courtesy of <a href={korenUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
      </span>
    </div>
  );
};

const ChuppahThankYou = () => {
  return (
    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
      <span className="text-sm platypi-medium text-black">
        Thank you to <a href="https://www.chuppah.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Chuppah.org</a> for providing this Teffila
      </span>
    </div>
  );
};

const NishmasThankYou = () => {
  return (
    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
      <span className="text-sm platypi-medium text-black">
        All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
      </span>
    </div>
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
        
        // Debug TTI/TBI conditions
        console.log('Loaded Tefilla conditions:', {
          isTTI: tefillaConditions.isTTI,
          isTBI: tefillaConditions.isTBI,
          isTTC: tefillaConditions.isTTC,
          isTBC: tefillaConditions.isTBC,
          isInIsrael: tefillaConditions.isInIsrael,
          allConditions: tefillaConditions
        });
        
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
  
  // Debug text processing for TTI issues
  if (text && text.includes('[[TTI]]')) {
    console.log('Processing text with TTI:', {
      hasConditions: !!effectiveConditions,
      isTTI: effectiveConditions.isTTI,
      isTBI: effectiveConditions.isTBI,
      isTTC: effectiveConditions.isTTC,
      isTBC: effectiveConditions.isTBC
    });
  }
  
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
  const { activeModal, closeModal } = useModalStore();
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
                    
                    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
                      <span className="text-sm platypi-medium text-black">
                        All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
                      </span>
                    </div>
                    
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
          {isModalComplete('morning-brochas') ? 'Completed Today' : 'Complete Shacharis'}
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
    default:
      return null;
  }
}

// Fullscreen content components for prayers
function MaarivFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { data: prayers = [], isLoading } = useQuery<MorningPrayer[]>({
    queryKey: ['/api/maariv/prayers'],
  });

  const tefillaConditions = useTefillaConditions();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();

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
      
      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <span className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </span>
      </div>

      <Button
        onClick={isModalComplete('maariv') ? undefined : handleComplete}
        disabled={isModalComplete('maariv')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('maariv') 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete('maariv') ? 'Completed Today' : 'Complete Maariv'}
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
      
      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <span className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </span>
      </div>

      <Button
        onClick={isModalComplete('mincha') ? undefined : handleComplete}
        disabled={isModalComplete('mincha')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('mincha') 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete('mincha') ? 'Completed Today' : 'Complete Mincha'}
      </Button>
    </div>
  );
}

function IndividualBrochaFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const selectedBrochaId = (window as any).selectedBrochaId;
  const tefillaConditions = useTefillaConditions();
  const { completeTask } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();

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
    // Track with specific brocha ID for backend analytics
    trackModalComplete(`brocha-${brocha.id}`);
    // Don't mark as complete since brochas are repeatable
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
                <input
                  type="checkbox"
                  id="grain"
                  checked={selectedOptions.grain}
                  onChange={(e) => setSelectedOptions(prev => ({ ...prev, grain: e.target.checked }))}
                  className="w-4 h-4 rounded border-blush/30 focus:ring-2 focus:ring-blush/20"
                  style={{ 
                    accentColor: selectedOptions.grain ? 'hsl(350, 45%, 85%)' : undefined
                  }}
                />
                <label 
                  htmlFor="grain" 
                  className="text-sm platypi-medium text-black cursor-pointer"
                >
                  Grains
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wine"
                  checked={selectedOptions.wine}
                  onChange={(e) => setSelectedOptions(prev => ({ ...prev, wine: e.target.checked }))}
                  className="w-4 h-4 rounded border-blush/30 focus:ring-2 focus:ring-blush/20"
                  style={{ 
                    accentColor: selectedOptions.wine ? 'hsl(350, 45%, 85%)' : undefined
                  }}
                />
                <label 
                  htmlFor="wine" 
                  className="text-sm platypi-medium text-black cursor-pointer"
                >
                  Wine
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fruit"
                  checked={selectedOptions.fruit}
                  onChange={(e) => setSelectedOptions(prev => ({ ...prev, fruit: e.target.checked }))}
                  className="w-4 h-4 rounded border-blush/30 focus:ring-2 focus:ring-blush/20"
                  style={{ 
                    accentColor: selectedOptions.fruit ? 'hsl(350, 45%, 85%)' : undefined
                  }}
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
      
      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <span className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </span>
      </div>

      <Button
        onClick={handleComplete}
        className="w-full py-3 rounded-xl platypi-medium border-0 mt-6 bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse"
      >
        Complete Brocha
      </Button>
    </div>
  );
}

function BrochasFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
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
      <div className="flex bg-warm-gray/10 rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            activeTab === 'daily'
              ? 'bg-white text-black'
              : 'text-black/60 hover:text-black'
          }`}
          style={activeTab === 'daily' ? { boxShadow: '0 4px 6px -1px hsla(350, 45%, 85%, 0.5), 0 2px 4px -1px hsla(350, 45%, 85%, 0.3)' } : {}}
        >
          Daily ({hasDaily ? dailyBrochas.length : 0})
        </button>
        <button
          onClick={() => setActiveTab('special')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            activeTab === 'special'
              ? 'bg-white text-black'
              : 'text-black/60 hover:text-black'
          }`}
          style={activeTab === 'special' ? { boxShadow: '0 4px 6px -1px hsla(350, 45%, 85%, 0.5), 0 2px 4px -1px hsla(350, 45%, 85%, 0.3)' } : {}}
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
                  {isModalComplete('morning-brochas') ? 'Completed Today' : 'Complete Shacharis'}
                </Button>
              </div>
            )}
          </div>
        );
      })}
      
      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <span className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </span>
      </div>
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
      className="fixed bottom-6 right-6 bg-gradient-feminine text-white rounded-full p-3 shadow-lg hover:scale-110 transition-all duration-200"
      style={{ zIndex: 2147483646 }}
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
    if (todayCompleted) return; // Prevent multiple completions on same day
    
    const today = new Date().toDateString();
    const newDay = nishmasDay + 1;
    
    // Track Nishmas completion and mark as completed
    trackModalComplete('nishmas-campaign');
    markModalComplete('nishmas-campaign');
    completeTask('tefilla');
    
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
      
      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <span className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </span>
      </div>

      <Button
        onClick={todayCompleted ? undefined : markNishmasCompleted}
        disabled={todayCompleted}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          todayCompleted 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {todayCompleted ? 'Completed Today' : 'Complete Nishmas'}
      </Button>
    </div>
  );
}

function TehillimFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { selectedPsalm, tehillimReturnTab, setTehillimActiveTab } = useModalStore();
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
    checkAndShowCongratulations();
    
    // Determine next psalm based on whether this is a specific part (by ID) or full psalm (by English number)
    let nextPsalm: number;
    
    if (tehillimInfo) {
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
      // This is a full psalm by English number - use simple increment
      nextPsalm = selectedPsalm < 150 ? selectedPsalm + 1 : 1;
    }
    
    // Update the selected psalm in the store
    const { setSelectedPsalm } = useModalStore.getState();
    setSelectedPsalm(nextPsalm);
    
    // The fullscreen content will automatically update due to the dependency on selectedPsalm
  };

  // Determine button layout based on stored return tab from Zustand store
  const isFromSpecialTab = tehillimReturnTab === 'special';



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
      
      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <span className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </span>
      </div>

      {/* Button(s) based on whether it's from 1-150 or special occasions */}
      {isFromSpecialTab ? (
        // Special occasions: Only show "Complete" button
        <Button
          onClick={isCompleted ? undefined : handleComplete}
          disabled={isCompleted}
          className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
            isCompleted 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
        >
          {isCompleted ? 'Completed Today' : `Complete Tehillim ${selectedPsalm}`}
        </Button>
      ) : (
        // All psalms (1-150): Show both "Complete" and "Complete & Next" buttons
        !isCompleted ? (
          <div className="flex gap-2">
            <Button
              onClick={handleComplete}
              className="flex-1 py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse"
            >
              Complete
            </Button>
            
            <Button
              onClick={handleCompleteAndNext}
              className="flex-1 py-3 rounded-xl platypi-medium border-0 bg-gradient-sage-to-blush text-white hover:scale-105 transition-transform complete-next-button-pulse"
            >
              Complete & Next ({selectedPsalm && selectedPsalm < 150 ? selectedPsalm + 1 : 1})
            </Button>
          </div>
        ) : (
          <Button
            disabled
            className="w-full py-3 rounded-xl platypi-medium border-0 bg-sage text-white cursor-not-allowed opacity-70"
          >
            Completed Today
          </Button>
        )
      )}
    </div>
  );
}

function GlobalTehillimFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { trackEvent } = useAnalytics();
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
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refetch every minute
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
    staleTime: 60000, // 1 minute
    refetchInterval: 30000 // Refetch every 30 seconds
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
    
    // Close fullscreen and return to previous view (1-150 or special occasions)
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
    
    // Show congratulations
    setTimeout(() => {
      checkAndShowCongratulations();
    }, 100);
  };

  const handleCompleteAndNext = async () => {
    // Track modal completion for feature usage (use unique key to avoid double counting)
    trackModalComplete('global-tehillim-chain');
    markModalComplete('tehillim-text');
    completeTask('tefilla');
    
    // Complete current and advance to next perek
    try {
      const result = await completeAndNextMutation.mutateAsync();
      
      // Show congratulations briefly
      checkAndShowCongratulations();
      
      // Small delay to let congratulations show, then reopen fullscreen with next perek
      setTimeout(() => {
        // Trigger fullscreen modal for the next perek
        const fullscreenEvent = new CustomEvent('openGlobalTehillimFullscreen', {
          detail: {
            nextPerek: result.progress.currentPerek,
            language: language
          }
        });
        window.dispatchEvent(fullscreenEvent);
      }, 1200);
      
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
      
      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <span className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </span>
      </div>

      <div className="flex gap-2 mt-6">
        {/* Complete button - returns to previous view */}
        <Button
          onClick={isCompleted ? undefined : handleComplete}
          disabled={isCompleted || advanceChainMutation.isPending || completeAndNextMutation.isPending}
          className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
            isCompleted 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
        >
          {isCompleted ? 'Completed' : advanceChainMutation.isPending ? 'Completing...' : 'Complete'}
        </Button>
        
        {/* Complete and Next button - goes to next tehillim in chain */}
        <Button
          onClick={isCompleted ? undefined : handleCompleteAndNext}
          disabled={isCompleted || advanceChainMutation.isPending || completeAndNextMutation.isPending}
          className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
            isCompleted 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-sage-to-blush text-white hover:scale-105 transition-transform complete-next-button-pulse'
          }`}
        >
          {isCompleted ? 'Completed' : completeAndNextMutation.isPending ? 'Loading Next...' : 'Complete & Next'}
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
        onClick={isModalComplete(modalKey) ? undefined : handleComplete}
        disabled={isModalComplete(modalKey)}
        className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
          isModalComplete(modalKey) 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
        }`}
      >
        {isModalComplete(modalKey) ? 'Completed Today' : 'Complete'}
      </Button>
    </div>
  );
}

export default function TefillaModals({ onSectionChange }: TefillaModalsProps) {
  const { activeModal, openModal, closeModal, selectedPsalm } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { trackEvent } = useAnalytics();
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
  const queryClient = useQueryClient();
  
  // Load Tefilla conditions for conditional content processing
  const tefillaConditions = useTefillaConditions();
  
  // Get Jewish times for info tooltips  
  const { coordinates } = useLocationStore();
  const jewishTimesQuery = useJewishTimes(coordinates?.lat, coordinates?.lng);

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
        It is better to daven between Tzeitz {times.tzaitHakochavim} and Chatsos Halyla {times.chatzos}.
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
  const [nishmasDay, setNishmasDay] = useState(() => {
    const saved = localStorage.getItem('nishmas-day');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [nishmasStartDate, setNishmasStartDate] = useState<string | null>(() => {
    return localStorage.getItem('nishmas-start-date');
  });
  const [nishmasLanguage, setNishmasLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [todayCompleted, setTodayCompleted] = useState(() => {
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
  const { data: progress, refetch: refetchProgress } = useQuery<GlobalTehillimProgress>({
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
  const { data: currentName, refetch: refetchCurrentName } = useQuery<TehillimName | null>({
    queryKey: ['/api/tehillim/current-name'],
    enabled: activeModal === 'tehillim-text',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  });

  // Get the tehillim info first to get the English number
  const { data: tehillimInfo, refetch: refetchTehillimInfo } = useQuery<{
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
  const { refetch: refetchTehillimText } = useQuery<{text: string; perek: number; language: string}>({
    queryKey: ['/api/tehillim/text/by-id', progress?.currentPerek, showHebrew ? 'hebrew' : 'english'],
    queryFn: async () => {
      if (!progress?.currentPerek) return null;
      const response = await axiosClient.get(`/api/tehillim/text/by-id/${progress.currentPerek}?language=${showHebrew ? 'hebrew' : 'english'}`);
      return response.data;
    },
    enabled: activeModal === 'tehillim-text' && !!progress?.currentPerek,
    staleTime: 0 // Always consider data stale to force fresh fetches
  });

  // Store closeModal reference to ensure it's available in mutation callbacks
  const closeModalRef = useRef(closeModal);
  useEffect(() => {
    closeModalRef.current = closeModal;
  }, [closeModal]);

  // Mutation to complete a perek and return to selector
  const completePerekMutation = useMutation({
    mutationFn: async () => {
      if (!progress) throw new Error('No progress data');
      return apiRequest('POST', `${import.meta.env.VITE_API_URL}/api/tehillim/complete`, { 
        currentPerek: progress.currentPerek,
        language: showHebrew ? 'hebrew' : 'english',
        completedBy: 'user' 
      });
    },
    onSuccess: async (response) => {
      // Track tehillim completion for analytics
      trackEvent("tehillim_complete", { 
        perek: progress?.currentPerek,
        language: showHebrew ? 'hebrew' : 'english',
        type: 'global'
      });
      
      // Track modal completion for daily tracking  
      trackModalComplete('global-tehillim-chain');
      markModalComplete('global-tehillim-chain');
      completeTask('tefilla');
      
      // Track name prayed for if there was one
      if (currentName) {
        trackEvent("name_prayed", {
          nameId: currentName.id,
          reason: currentName.reason,
          perek: progress?.currentPerek
        });
      }
      
      toast({
        title: "Perek Completed!",
        description: tehillimInfo?.partNumber && tehillimInfo.partNumber > 1 
          ? `Perek ${tehillimInfo.englishNumber} Part ${tehillimInfo.partNumber} has been completed.`
          : `Perek ${tehillimInfo?.englishNumber || 'current'} has been completed.`,
      });
      
      // Dispatch event for the tefilla section to refresh
      window.dispatchEvent(new Event('tehillimCompleted'));
      
      // Invalidate analytics stats to show updated counts immediately
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/month'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/total'] });
      
      // Check for congratulations after completion
      setTimeout(() => {
        checkAndShowCongratulations();
      }, 100);
      
      // Close modal after short delay to show toast
      setTimeout(() => {
        closeModal();
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete perek. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to complete and go to next
  const completeAndNextMutation = useMutation({
    mutationFn: async () => {
      if (!progress) throw new Error('No progress data');
      return apiRequest('POST', `${import.meta.env.VITE_API_URL}/api/tehillim/complete`, { 
        currentPerek: progress.currentPerek,
        language: showHebrew ? 'hebrew' : 'english',
        completedBy: 'user' 
      });
    },
    onSuccess: async (response) => {
      // Track tehillim completion for analytics
      trackEvent("tehillim_complete", { 
        perek: progress?.currentPerek,
        language: showHebrew ? 'hebrew' : 'english',
        type: 'global'
      });
      
      // Track modal completion for daily tracking  
      trackModalComplete('global-tehillim-chain');
      markModalComplete('global-tehillim-chain');
      completeTask('tefilla');
      
      // Track name prayed for if there was one
      if (currentName) {
        trackEvent("name_prayed", {
          nameId: currentName.id,
          reason: currentName.reason,
          perek: progress?.currentPerek
        });
      }
      
      toast({
        title: "Perek Completed!",
        description: tehillimInfo?.partNumber && tehillimInfo.partNumber > 1 
          ? `Perek ${tehillimInfo.englishNumber} Part ${tehillimInfo.partNumber} has been completed. Loading next section...`
          : `Perek ${tehillimInfo?.englishNumber || 'current'} has been completed. Loading next perek...`,
      });
      
      // Check for congratulations after completion
      setTimeout(() => {
        checkAndShowCongratulations();
      }, 100);
      
      // Immediately refetch all data to show the new perek
      await Promise.all([
        refetchProgress(),
        refetchCurrentName(),
        refetchTehillimInfo(),
        refetchTehillimText()
      ]);
      
      // Also invalidate queries for other components
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/preview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/text'] });
      
      // Invalidate analytics stats to show updated counts immediately
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/month'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/total'] });
      
      // Dispatch event for the tefilla section to refresh
      window.dispatchEvent(new Event('tehillimCompleted'));
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete perek. Please try again.",
        variant: "destructive"
      });
    }
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

  // Mark today's Nishmas as completed
  const markNishmasCompleted = () => {
    if (todayCompleted) return; // Prevent multiple completions on same day
    
    const today = new Date().toDateString();
    const newDay = nishmasDay + 1;
    

    
    // Track Nishmas completion and mark as completed
    trackModalComplete('nishmas');
    markModalComplete('nishmas');
    
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
    
    // Complete tefilla task and redirect to home
    completeTask('tefilla');
    setShowExplosion(true);
    
    setTimeout(() => {
      setShowExplosion(false);
      checkAndShowCongratulations();
      closeModal();
      
      // Navigate to home section and scroll to progress to show flower growth
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
      } else {
        // Fallback: redirect to home with scroll parameter
        window.location.hash = '#/?section=home&scrollToProgress=true';
      }
    }, 2000);
  };



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
                    
                    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
                      <span className="text-sm platypi-medium text-black">
                        All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
                      </span>
                    </div>
                    
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
              {isModalComplete('mincha') ? 'Completed Today' : 'Complete Mincha'}
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
              onClick={isModalComplete('blessings') ? undefined : () => completeWithAnimation('blessings')}
              disabled={isModalComplete('blessings')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('blessings') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('blessings') ? 'Completed Today' : 'Complete Blessings'}
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
              onClick={isModalComplete('tefillos') ? undefined : () => completeWithAnimation('tefillos')}
              disabled={isModalComplete('tefillos')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('tefillos') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('tefillos') ? 'Completed Today' : 'Complete Tefillos'}
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
              onClick={isModalComplete('personal-prayers') ? undefined : () => completeWithAnimation('personal-prayers')}
              disabled={isModalComplete('personal-prayers')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('personal-prayers') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('personal-prayers') ? 'Completed Today' : 'Complete Personal Prayers'}
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
                      
                      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
                        <p className="text-sm platypi-medium text-black">
                          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
                        </p>
                      </div>
                      
                      <div className="heart-explosion-container">
                        <Button 
                          onClick={isModalComplete('nishmas-campaign') ? undefined : () => {
                            trackModalComplete('nishmas-campaign');
                            markModalComplete('nishmas-campaign');
                            completeTask('tefilla');
                            setFullscreenContent({ isOpen: false, title: '', content: null });
                            
                            // Check if all tasks are completed and show congratulations
                            if (checkAndShowCongratulations()) {
                              openModal('congratulations', 'tefilla');
                            }
                          }}
                          disabled={isModalComplete('nishmas-campaign')}
                          className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                            isModalComplete('nishmas-campaign') 
                              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                          }`}
                        >
                          {isModalComplete('nishmas-campaign') ? 'Completed Today' : 'Complete'}
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
              {isModalComplete('maariv') ? 'Completed Today' : 'Complete Maariv'}
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
      
      {/* Jerusalem Compass Modal */}
      <Dialog open={activeModal === 'jerusalem-compass'} onOpenChange={() => closeModal(true)}>
        <DialogContent>
          <VisuallyHidden>
            <DialogDescription>Compass to find direction to Jerusalem for prayer</DialogDescription>
          </VisuallyHidden>
          <div className="px-4 select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}>
            <SimpleCompassUI onClose={() => closeModal()} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Modal */}
      <FullscreenModal
        isOpen={fullscreenContent.isOpen}
        onClose={() => setFullscreenContent({ isOpen: false, title: '', content: null })}
        title={fullscreenContent.title}
        showFontControls={fullscreenContent.contentType !== 'special-tehillim' && fullscreenContent.contentType !== 'brochas'}
        showLanguageControls={
          fullscreenContent.contentType !== 'special-tehillim' && 
          fullscreenContent.contentType !== 'brochas' &&
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
          fullscreenContent.contentType === 'morning-brochas' ? setShowMorningBrochasInfo :
          fullscreenContent.title === 'Maariv Prayer' ? setShowMaarivInfo : undefined
        }
        infoContent={
          fullscreenContent.contentType === 'morning-brochas' ? getMorningBrochasTooltip() :
          fullscreenContent.title === 'Maariv Prayer' ? getMaarivTooltip() : undefined
        }
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
  const { closeModal } = useModalStore();
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
          onClick={isModalComplete(modalKey) ? undefined : () => {
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
          disabled={isModalComplete(modalKey)}
          className={`w-full py-3 rounded-xl platypi-medium border-0 ${
            isModalComplete(modalKey) 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
        >
          {isModalComplete(modalKey) ? 'Completed Today' : 'Complete'}
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
function SpecialTehillimFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english'; fontSize: number }) {
  const { openModal, setSelectedPsalm, tehillimActiveTab, setTehillimActiveTab, setTehillimReturnTab } = useModalStore();
  const { isModalComplete } = useModalCompletionStore();

  // Debug log to track active tab


  // Open individual Tehillim text
  const openTehillimText = (psalmNumber: number) => {
    // Store the current tab so we can return to it after completion

    setTehillimReturnTab(tehillimActiveTab); // Store in Zustand instead of localStorage
    setSelectedPsalm(psalmNumber);
    
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
      <div className="flex bg-warm-gray/10 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTehillimActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            tehillimActiveTab === 'all'
              ? 'bg-white text-black shadow-sm'
              : 'text-black/60 hover:text-black'
          }`}
        >
          Sefer Tehillim
        </button>
        <button
          onClick={() => setTehillimActiveTab('special')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            tehillimActiveTab === 'special'
              ? 'bg-white text-black shadow-sm'
              : 'text-black/60 hover:text-black'
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

      <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
        <span className="text-sm platypi-medium text-black">
          All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
        </span>
      </div>

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

// Tehillim Modal Component (previously Special Tehillim)
function SpecialTehillimModal() {
  const { closeModal, openModal, setSelectedPsalm, tehillimActiveTab, setTehillimActiveTab } = useModalStore();
  const { isModalComplete } = useModalCompletionStore();

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
      <div className="flex bg-warm-gray/10 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTehillimActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            tehillimActiveTab === 'all'
              ? 'bg-white text-black shadow-sm'
              : 'text-black/60 hover:text-black'
          }`}
        >
          Sefer Tehillim
        </button>
        <button
          onClick={() => setTehillimActiveTab('special')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm platypi-medium transition-all ${
            tehillimActiveTab === 'special'
              ? 'bg-white text-black shadow-sm'
              : 'text-black/60 hover:text-black'
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
  const { closeModal, openModal, selectedPsalm, previousModal, tehillimActiveTab } = useModalStore();
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
                
                <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
                  <p className="text-sm platypi-medium text-black">
                    All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
                  </p>
                </div>
                
                <div className="heart-explosion-container">
                  <div className={tehillimActiveTab === 'all' ? 'flex gap-2' : ''}>
                    {/* Complete button - returns to Tehillim selector */}
                    <Button 
                      onClick={isModalComplete(`individual-tehillim-${selectedPsalm}`) ? undefined : () => {
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
                          checkAndShowCongratulations();
                          openModal('special-tehillim', 'tefilla');
                        }, 400);
                      }}
                      disabled={isModalComplete(`individual-tehillim-${selectedPsalm}`)}
                      className={`${tehillimActiveTab === 'all' ? 'flex-1' : 'w-full'} py-3 rounded-xl platypi-medium border-0 ${
                        isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                          ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                          : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                      }`}
                    >
                      {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Completed' : 'Complete'}
                    </Button>
                    
                    {/* Complete and Next button - only show when coming from 1-150 tab */}
                    {tehillimActiveTab === 'all' && (
                      <Button 
                        onClick={isModalComplete(`individual-tehillim-${selectedPsalm}`) ? undefined : () => {
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
                            // Stay in fullscreen and navigate to next psalm
                            openModal('individual-tehillim', 'tefilla', nextPsalm);
                          }, 400);
                        }}
                        disabled={isModalComplete(`individual-tehillim-${selectedPsalm}`)}
                        className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
                          isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                            : 'bg-gradient-sage-to-blush text-white hover:scale-105 transition-transform complete-next-button-pulse'
                        }`}
                      >
                        {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Completed' : 'Complete & Next'}
                      </Button>
                    )}
                  </div>
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
  }, [selectedPsalm, tehillimText, language, fontSize, tehillimActiveTab, setFullscreenContent, tehillimInfo]);

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
                  
                  <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
                    <p className="text-sm platypi-medium text-black">
                      All tefilla texts courtesy of <a href="https://korenpub.co.il/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
                    </p>
                  </div>
                  
                  <div className="heart-explosion-container">
                    <div className={tehillimActiveTab === 'all' ? 'flex gap-2' : ''}>
                      {/* Complete button - returns to Tehillim selector */}
                      <Button 
                        onClick={isModalComplete(`individual-tehillim-${selectedPsalm}`) ? undefined : () => {
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
                        disabled={isModalComplete(`individual-tehillim-${selectedPsalm}`)}
                        className={`${tehillimActiveTab === 'all' ? 'flex-1' : 'w-full'} py-3 rounded-xl platypi-medium border-0 ${
                          isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                        }`}
                      >
                        {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Completed' : 'Complete'}
                      </Button>
                      
                      {/* Complete and Next button - only show when coming from 1-150 tab */}
                      {tehillimActiveTab === 'all' && (
                        <Button 
                          onClick={isModalComplete(`individual-tehillim-${selectedPsalm}`) ? undefined : () => {
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
                              checkAndShowCongratulations();
                              // Stay in fullscreen and navigate to next psalm
                              openModal('individual-tehillim', 'tefilla', nextPsalm);
                            }, 400);
                          }}
                          disabled={isModalComplete(`individual-tehillim-${selectedPsalm}`)}
                          className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
                            isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                              : 'bg-gradient-sage-to-blush text-white hover:scale-105 transition-transform complete-next-button-pulse'
                          }`}
                        >
                          {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Completed' : 'Complete & Next'}
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
          onClick={isModalComplete(`individual-tehillim-${selectedPsalm}`) ? undefined : () => {
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
              checkAndShowCongratulations();
              openModal('special-tehillim', 'tefilla');
            }, 400);
          }}
          disabled={isModalComplete(`individual-tehillim-${selectedPsalm}`)}
          className={`${tehillimActiveTab === 'all' ? 'flex-1' : 'w-full'} py-3 rounded-xl platypi-medium border-0 ${
            isModalComplete(`individual-tehillim-${selectedPsalm}`) 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
        >
          {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Completed' : 'Complete'}
        </Button>

        {/* Complete and Next button - only show when coming from 1-150 tab */}
        {tehillimActiveTab === 'all' && (
          <Button 
            onClick={isModalComplete(`individual-tehillim-${selectedPsalm}`) ? undefined : () => {
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
                checkAndShowCongratulations();
                if (nextPsalm <= 150) {
                  openModal('individual-tehillim', 'special-tehillim', nextPsalm);
                } else {
                  openModal('special-tehillim', 'tefilla');
                }
              }, 400);
            }}
            disabled={isModalComplete(`individual-tehillim-${selectedPsalm}`)}
            className={`flex-1 py-3 rounded-xl platypi-medium border-0 ${
              isModalComplete(`individual-tehillim-${selectedPsalm}`) 
                ? 'bg-muted-lavender text-white cursor-not-allowed opacity-70' 
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
