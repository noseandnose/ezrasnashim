import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { HandHeart, Scroll, Heart, Languages, Type, Plus, Minus, CheckCircle, Calendar, RotateCcw, User, Sparkles, Compass, MapPin, ArrowUp, Stethoscope, HeartHandshake, Baby, DollarSign, Star, Users, GraduationCap, Smile, Link, Shield, Unlock, Check } from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
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
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { Expand } from "lucide-react";

// Import compass icons
import bhPinkIcon from '@assets/BH_Pink_1755681221620.png';
import bhGreenIcon from '@assets/BH_Green_1755681221619.png';

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

const ChuppahThankYou = () => {
  return (
    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
      <span className="text-sm platypi-medium text-black">
        Thank you to{' '}
        <a 
          href="https://www.chuppah.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-700"
        >
          Chuppah.org
        </a>
        {' '}for providing this Teffila
      </span>
    </div>
  );
};

const NishmasThankYou = () => {
  return (
    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
      <span className="text-sm platypi-medium text-black">
        Thank you to{' '}
        <a 
          href="https://www.nishmas.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-700"
        >
          Nishmas.net
        </a>
        {' '}for providing this Tefilla
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

  return conditions;
};

// Enhanced text processing function for Tefilla content
const processTefillaContent = (text: string, conditions: TefillaConditions | null): string => {
  
  if (!conditions || !text) return formatTextContent(text);
  
  const processedText = processTefillaText(text, conditions);
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

const getReasonShort = (reason: string, reasonEnglish?: string) => {
  // Map Hebrew reasons and English translations to short text
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
  const shortMap: Record<string, string> = {
    'health': 'Health',
    'shidduch': 'Match',
    'children': 'Kids',
    'parnassa': 'Income',
    'success': 'Success',
    'family': 'Family',
    'education': 'Study',
    'peace': 'Peace',
    'hostages': 'Release',
    'general': 'Prayer'
  };
  
  return shortMap[code];
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
  const [showEnglish, setShowEnglish] = useState(false);
  
  // Load Tefilla conditions for conditional content processing
  const tefillaConditions = useTefillaConditions();
  
  // Fetch morning prayers from database
  const { data: morningPrayers, isLoading, error } = useQuery({
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
                        All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
                      </span>
                    </div>
                    
                    <div className="heart-explosion-container">
                      <Button 
                        onClick={isModalComplete('morning-brochas') ? undefined : () => {
                          trackModalComplete('morning-brochas');
                          markModalComplete('morning-brochas');
                          completeTask('tefilla');
                          setFullscreenContent({ isOpen: false, title: '', content: null });
                          checkAndShowCongratulations();
                        }}
                        disabled={isModalComplete('morning-brochas')}
                        className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                          isModalComplete('morning-brochas') 
                            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
          {/* First Row: Language Toggle and Title */}
          <div className="flex items-center justify-center gap-4">
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
              {morningPrayers?.map((prayer: MorningPrayer, index: number) => (
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
              checkAndShowCongratulations();
              closeModal();
              window.location.hash = '#/?section=home&scrollToProgress=true';
            }, 2000);
          }}
          disabled={isLoading || isModalComplete('morning-brochas')}
          className={`w-full py-3 rounded-xl platypi-medium border-0 ${
            isModalComplete('morning-brochas') 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
          }`}
        >
          {isModalComplete('morning-brochas') ? 'Completed Today' : 'Complete Morning Brochas'}
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
      return <MorningBrochasFullscreenContent language={language} fontSize={fontSize} />;
    case 'nishmas-campaign':
      return <NishmasFullscreenContent language={language} fontSize={fontSize} />;
    case 'individual-tehillim':
      return <TehillimFullscreenContent language={language} fontSize={fontSize} />;
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
  const { data: prayers = [], isLoading } = useQuery<any[]>({
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
          All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
        </span>
      </div>

      <Button
        onClick={isModalComplete('maariv') ? undefined : handleComplete}
        disabled={isModalComplete('maariv')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('maariv') 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
          All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
        </span>
      </div>

      <Button
        onClick={isModalComplete('mincha') ? undefined : handleComplete}
        disabled={isModalComplete('mincha')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('mincha') 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
        }`}
      >
        {isModalComplete('mincha') ? 'Completed Today' : 'Complete Mincha'}
      </Button>
    </div>
  );
}

function MorningBrochasFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { data: prayers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/morning/prayers'],
  });

  const tefillaConditions = useTefillaConditions();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
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
          All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
        </span>
      </div>

      <Button
        onClick={isModalComplete('morning-brochas') ? undefined : handleComplete}
        disabled={isModalComplete('morning-brochas')}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isModalComplete('morning-brochas') 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
        }`}
      >
        {isModalComplete('morning-brochas') ? 'Completed Today' : 'Complete Morning Brochas'}
      </Button>
    </div>
  );
}

// Nishmas Fullscreen Content Component
function NishmasFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { data: nishmasText, isLoading } = useQuery<NishmasText>({
    queryKey: [`/api/nishmas/${language}`],
  });

  const { markModalComplete, isModalComplete } = useModalCompletionStore();
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
          Thank you to{' '}
          <a 
            href="https://www.nishmas.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-700"
          >
            Nishmas.net
          </a>
          {' '}for providing this Tefilla
        </span>
      </div>

      <Button
        onClick={todayCompleted ? undefined : markNishmasCompleted}
        disabled={todayCompleted}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          todayCompleted 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
        }`}
      >
        {todayCompleted ? 'Completed Today' : 'Complete Nishmas'}
      </Button>
    </div>
  );
}

function TehillimFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { selectedPsalm, tehillimActiveTab, tehillimReturnTab, setTehillimActiveTab } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const tefillaConditions = useTefillaConditions();

  const { data: tehillimText, isLoading } = useQuery({
    queryKey: ['/api/tehillim/text', selectedPsalm, language],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/tehillim/text/${selectedPsalm}?language=${language}`);
      return response.data;
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
    checkAndShowCongratulations();
    
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

  const handleCompleteAndNext = () => {
    if (!selectedPsalm) return;
    
    trackModalComplete(completionKey);
    markModalComplete(completionKey);
    completeTask('tefilla');
    checkAndShowCongratulations();
    
    // Move to next psalm (only for 1-150 sequence)
    const nextPsalm = selectedPsalm < 150 ? selectedPsalm + 1 : 1;
    
    // Update the selected psalm in the store
    const { setSelectedPsalm } = useModalStore.getState();
    setSelectedPsalm(nextPsalm);
    
    // The fullscreen content will automatically update due to the dependency on selectedPsalm
  };

  // Determine button layout based on stored return tab from Zustand store
  const isFromSpecialTab = tehillimReturnTab === 'special';
  const isFromAllTab = tehillimReturnTab === 'all' || !tehillimReturnTab; // Default to all if not set


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
          All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
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
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
              className="flex-1 py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform"
            >
              Complete
            </Button>
            
            <Button
              onClick={handleCompleteAndNext}
              className="flex-1 py-3 rounded-xl platypi-medium border-0 bg-blush text-white hover:scale-105 transition-transform"
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

  // Get current psalm text
  const { data: tehillimText, isLoading } = useQuery({
    queryKey: ['/api/tehillim/text', progress?.currentPerek, language],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/tehillim/text/${progress?.currentPerek}?language=${language}`);
      return response.data;
    },
    enabled: !!progress?.currentPerek,
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

  // Define mutation before any conditional returns (hooks rule)
  const advanceChainMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPerek: progress?.currentPerek,
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
        perek: progress?.currentPerek,
        language: language
      });
      
      // Track name prayed for if there was one
      if (currentName) {
        trackEvent("name_prayed", {
          nameId: currentName.id,
          reason: currentName.reason,
          perek: progress?.currentPerek
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

  // Early returns after all hooks are defined
  if (isLoading) return <div className="text-center py-8">Loading Tehillim...</div>;
  if (!progress?.currentPerek) return <div className="text-center py-8">No Tehillim available</div>;

  // Use unique key per Tehillim number for proper individual tracking
  const completionKey = `tehillim-chain-${progress?.currentPerek}`;
  const isCompleted = isModalComplete(completionKey);

  const handleComplete = () => {
    // Track modal completion for feature usage (use unique key to avoid double counting)
    trackModalComplete('global-tehillim-chain');
    markModalComplete('tehillim-text');
    completeTask('tefilla');
    
    // Advance the chain (this will trigger the analytics tracking in onSuccess)
    advanceChainMutation.mutate();
    
    // Close fullscreen and return to home
    const event = new CustomEvent('closeFullscreen');
    window.dispatchEvent(event);
    
    // Show congratulations
    setTimeout(() => {
      checkAndShowCongratulations();
    }, 100);
  };

  return (
    <div className="space-y-4">
      {/* Current name being prayed for - moved above Tehillim text */}
      {currentName && (
        <div className="bg-sage/10 rounded-xl p-3 border border-sage/20">
          <div className="flex items-center justify-center gap-2">
            {getReasonIcon(currentName.reasonEnglish || currentName.reason)}
            <span className="text-sm platypi-medium text-black">
              Davening for: {currentName.hebrewName}
            </span>
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
          All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
        </span>
      </div>

      <Button
        onClick={isCompleted ? undefined : handleComplete}
        disabled={isCompleted}
        className={`w-full py-3 rounded-xl platypi-medium border-0 mt-6 ${
          isCompleted 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
        }`}
      >
        {isCompleted ? 'Completed Today' : `Complete Tehillim ${progress?.currentPerek}`}
      </Button>
    </div>
  );
}

function IndividualPrayerFullscreenContent({ language, fontSize }: { language: 'hebrew' | 'english', fontSize: number }) {
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
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
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
  const [, setLocation] = useLocation();
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [activeExplosionModal, setActiveExplosionModal] = useState<string | null>(null);
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

  // Listen for fullscreen close events from fullscreen components
  useEffect(() => {
    const handleCloseFullscreen = () => {
      setFullscreenContent({ isOpen: false, title: '', content: null, hasTranslation: undefined });
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
        content: null,
        hasTranslation: undefined
      });
    };

    window.addEventListener('closeFullscreen', handleCloseFullscreen);
    window.addEventListener('openDirectFullscreen', handleDirectFullscreen as EventListener);
    return () => {
      window.removeEventListener('closeFullscreen', handleCloseFullscreen);
      window.removeEventListener('openDirectFullscreen', handleDirectFullscreen as EventListener);
    };
  }, []);

  // Reset explosion state when modal changes
  useEffect(() => {
    setShowExplosion(false);
  }, [activeModal]);

  // Auto-redirect prayer modals to fullscreen
  useEffect(() => {
    const fullscreenPrayerModals = ['morning-brochas', 'mincha', 'maariv', 'nishmas-campaign', 'individual-tehillim', 'tehillim-text', 'special-tehillim'];
    
    if (activeModal && fullscreenPrayerModals.includes(activeModal)) {
      let title = '';
      let contentType = activeModal;
      
      switch (activeModal) {
        case 'morning-brochas':
          title = 'Morning Brochas';
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
          title = `Tehillim ${selectedPsalm}`;
          contentType = 'individual-tehillim';
          break;
        case 'special-tehillim':
          title = 'Tehillim';
          contentType = 'special-tehillim';
          break;
        case 'tehillim-text':
          title = 'Global Tehillim Chain';
          contentType = 'global-tehillim';
          break;
      }
      
      // Open fullscreen immediately without closing modal first
      setFullscreenContent({
        isOpen: true,
        title,
        contentType,
        content: null // Content will be rendered based on contentType
      });
      
      // Close the regular modal after fullscreen opens
      setTimeout(() => {
        closeModal();
      }, 10);
    }
  }, [activeModal, closeModal, selectedPsalm]);

  // Update fullscreen title when selectedPsalm changes for individual Tehillim
  useEffect(() => {
    if (fullscreenContent.isOpen && fullscreenContent.contentType === 'individual-tehillim' && selectedPsalm) {
      setFullscreenContent(current => ({
        ...current,
        title: `Tehillim ${selectedPsalm}`
      }));
    }
  }, [selectedPsalm, fullscreenContent.isOpen, fullscreenContent.contentType]);

  // Listen for custom close fullscreen events
  useEffect(() => {
    const handleCloseFullscreen = () => {
      setFullscreenContent({ isOpen: false, title: '', content: null });
      // Navigate to home section and show flower growth
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
      content: null,
      hasTranslation: undefined // Will be determined when prayer data loads
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
  const { data: tehillimText, refetch: refetchTehillimText } = useQuery<{text: string; perek: number; language: string}>({
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
        language: showHebrew ? 'hebrew' : 'english'
      });
      
      // Track modal completion for daily tracking
      trackModalComplete('tehillim-text');
      markModalComplete('tehillim-text');
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
        language: showHebrew ? 'hebrew' : 'english'
      });
      
      // Track modal completion for daily tracking
      trackModalComplete('tehillim-text');
      markModalComplete('tehillim-text');
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

  const completePerek = () => {
    completePerekMutation.mutate();
  };

  const getTehillimDisplayText = () => {
    if (!tehillimText) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
        </div>
      );
    }

    // Apply text formatting to clean Hebrew text
    const formattedText = formatTextContent(tehillimText.text);

    return (
      <div 
        className={`leading-relaxed whitespace-pre-line ${showHebrew ? 'vc-koren-hebrew text-right' : 'koren-siddur-english text-left'}`}
        style={{ fontSize: `${showHebrew ? fontSize + 1 : fontSize}px` }}
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  };

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

  // Reset Nishmas campaign
  const resetNishmasCampaign = () => {
    setNishmasDay(0);
    setNishmasStartDate(null);
    setTodayCompleted(false);
    localStorage.removeItem('nishmas-day');
    localStorage.removeItem('nishmas-start-date');
    localStorage.removeItem('nishmas-last-completed');
  };

  return (
    <>
      {/* Tehillim Text Modal */}
      <Dialog open={activeModal === 'tehillim-text'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular relative" aria-describedby="tehillim-description">
          <div id="tehillim-description" className="sr-only">Psalms reading and community prayer participation</div>
          
          {/* Fullscreen button */}
          <button
            onClick={() => {
              setFullscreenContent({
                isOpen: true,
                title: `Tehillim ${tehillimInfo?.englishNumber || progress?.currentPerek || 1}${tehillimInfo?.englishNumber === 119 && tehillimInfo?.partNumber ? ` - Part ${tehillimInfo.partNumber}` : ''}`,
                content: (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-6 border border-blush/10">
                      <div
                        className={`${showHebrew ? 'vc-koren-hebrew' : 'koren-siddur-english'} leading-relaxed text-black`}
                        style={{ fontSize: `${showHebrew ? fontSize + 1 : fontSize}px` }}
                      >
                        {getTehillimDisplayText()}
                      </div>
                    </div>

                    {/* Prayer Name Display Bar */}
                    {currentName && (
                      <div className="bg-gray-50/10 rounded-xl p-3 border border-blush/10">
                        <div className="flex items-center justify-center gap-2">
                          {getReasonIcon(currentName.reason, currentName.reasonEnglish || undefined)}
                          <span className="text-sm platypi-medium text-black">
                            Praying for: {currentName.hebrewName}
                          </span>
                          <span className="text-xs platypi-regular text-black/60">
                            ({getReasonShort(currentName.reason, currentName.reasonEnglish || undefined)})
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
                      <span className="text-sm platypi-medium text-black">
                        All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
                      </span>
                    </div>
                    
                    <div className="heart-explosion-container">
                      <div className="flex gap-2">
                        {/* Complete button - returns to Tehillim selector */}
                        <Button 
                          onClick={async () => {
                            // Use the proper completion mutation to ensure analytics tracking
                            try {
                              await completePerekMutation.mutateAsync();
                              // Only close fullscreen after successful completion
                              setFullscreenContent({ isOpen: false, title: '', content: null });
                            } catch (error) {
                              console.error('Failed to complete perek:', error);
                            }
                          }}
                          disabled={completePerekMutation.isPending || completeAndNextMutation.isPending}
                          className="flex-1 bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0"
                        >
                          {completePerekMutation.isPending ? 'Completing...' : 'Complete'}
                        </Button>
                        
                        {/* Complete and Next button - goes to next tehillim */}
                        <Button 
                          onClick={async () => {
                            // Complete current perek and immediately refetch to get next one
                            try {
                              await completeAndNextMutation.mutateAsync();
                              // Only close fullscreen after successful completion
                              setFullscreenContent({ isOpen: false, title: '', content: null });
                            } catch (error) {
                              console.error('Failed to complete and advance perek:', error);
                            }
                          }}
                          disabled={completePerekMutation.isPending || completeAndNextMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-sage to-sage/90 text-white py-3 rounded-xl platypi-medium border-0"
                        >
                          {completeAndNextMutation.isPending ? 'Loading Next...' : 'Complete & Next'}
                        </Button>
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
          
          {/* Standardized Header with two-row layout */}
          <div className="mb-2 space-y-2">
            {/* First Row: Language Toggle and Title */}
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => {
                  const newShowHebrew = !showHebrew;
                  setShowHebrew(newShowHebrew);
                  // Save language preference for Tehillim
                  localStorage.setItem('tehillim-language', newShowHebrew ? 'hebrew' : 'english');
                }}
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
              
              <DialogTitle className="text-lg platypi-bold text-black">
                Tehillim {tehillimInfo?.englishNumber || progress?.currentPerek || 1}
                {tehillimInfo?.englishNumber === 119 && tehillimInfo?.partNumber ? ` - Part ${tehillimInfo.partNumber}` : ''}
              </DialogTitle>
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
            <div
              className={`${showHebrew ? 'vc-koren-hebrew' : 'koren-siddur-english'} leading-relaxed text-black`}
              style={{ fontSize: `${showHebrew ? fontSize + 1 : fontSize}px` }}
            >
              {getTehillimDisplayText()}
            </div>
          </div>

          {/* Prayer Name Display Bar */}
          {currentName && (
            <div className="bg-gray-50/10 rounded-xl p-3 mx-1 border border-blush/10">
              <div className="flex items-center justify-center gap-2">
                {getReasonIcon(currentName.reason, currentName.reasonEnglish || undefined)}
                <span className="text-sm platypi-medium text-black">
                  Praying for: {currentName.hebrewName}
                </span>
                <span className="text-xs platypi-regular text-black/60">
                  ({getReasonShort(currentName.reason, currentName.reasonEnglish || undefined)})
                </span>
              </div>
            </div>
          )}

          <KorenThankYou />

          <div className="heart-explosion-container">
            <div className="flex gap-2">
              {/* Complete button - returns to Tehillim selector */}
              <Button 
                onClick={() => {
                  completePerek();
                  completeWithAnimation();
                }}
                disabled={completePerekMutation.isPending || completeAndNextMutation.isPending}
                className="flex-1 bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0"
              >
                {completePerekMutation.isPending ? 'Completing...' : 'Complete'}
              </Button>
              
              {/* Complete and Next button - goes to next tehillim */}
              <Button 
                onClick={() => {
                  // Complete current perek and immediately refetch to get next one
                  completeAndNextMutation.mutate();
                }}
                disabled={completePerekMutation.isPending || completeAndNextMutation.isPending}
                className="flex-1 bg-gradient-to-r from-sage to-sage/90 text-white py-3 rounded-xl platypi-medium border-0"
              >
                {completeAndNextMutation.isPending ? 'Loading Next...' : 'Complete & Next'}
              </Button>
            </div>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
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
                        All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
                      </span>
                    </div>
                    
                    <div className="heart-explosion-container">
                      <Button 
                        onClick={isModalComplete('mincha') ? undefined : () => {
                          trackModalComplete('mincha');
                          markModalComplete('mincha');
                          completeTask('tefilla');
                          setFullscreenContent({ isOpen: false, title: '', content: null });
                          checkAndShowCongratulations();
                        }}
                        disabled={isModalComplete('mincha')}
                        className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                          isModalComplete('mincha') 
                            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
                        <span className="text-sm platypi-medium text-black">
                          All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
                        </span>
                      </div>
                      
                      <div className="heart-explosion-container">
                        <Button 
                          onClick={isModalComplete('nishmas-campaign') ? undefined : () => {
                            trackModalComplete('nishmas-campaign');
                            markModalComplete('nishmas-campaign');
                            completeTask('tefilla');
                            setFullscreenContent({ isOpen: false, title: '', content: null });
                            checkAndShowCongratulations();
                          }}
                          disabled={isModalComplete('nishmas-campaign')}
                          className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                            isModalComplete('nishmas-campaign') 
                              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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

      {/* Maariv Modal */}
      <Dialog open={activeModal === 'maariv'} onOpenChange={() => closeModal(true)}>
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
          
          <StandardModalHeader 
            title="Maariv Prayer"
            showHebrew={language === 'hebrew'}
            setShowHebrew={(show) => setLanguage(show ? 'hebrew' : 'english')}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />

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
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
              }`}
            >
              {isModalComplete('maariv') ? 'Completed Today' : 'Complete Maariv'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

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
      <JerusalemCompass />

      {/* Fullscreen Modal */}
      <FullscreenModal
        isOpen={fullscreenContent.isOpen}
        onClose={() => setFullscreenContent({ isOpen: false, title: '', content: null, hasTranslation: undefined })}
        title={fullscreenContent.title}
        showFontControls={fullscreenContent.contentType !== 'special-tehillim'}
        showLanguageControls={
          fullscreenContent.contentType !== 'special-tehillim' && 
          (fullscreenContent.contentType !== 'individual-prayer' || fullscreenContent.hasTranslation !== false)
        }
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        language={language}
        onLanguageChange={setLanguage}
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
              checkAndShowCongratulations();
              closeModal();
              window.location.hash = '#/?section=home&scrollToProgress=true';
            }, 2000);
          }}
          disabled={isModalComplete(modalKey)}
          className={`w-full py-3 rounded-xl platypi-medium border-0 ${
            isModalComplete(modalKey) 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
          All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
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

// Individual Tehillim Modal Component
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

  const { data: tehillimText, isLoading } = useQuery({
    queryKey: ['/api/tehillim/text', selectedPsalm, language],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/tehillim/text/${selectedPsalm}?language=${language}`);
      return response.data;
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
          return {
            isOpen: true,
            title: `Tehillim ${selectedPsalm}`,
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
                  <span className="text-sm platypi-medium text-black">
                    All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
                  </span>
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
                          : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
                            : 'bg-gradient-to-r from-sage to-sage/90 text-white hover:scale-105 transition-transform'
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
  }, [selectedPsalm, tehillimText, language, fontSize, tehillimActiveTab, setFullscreenContent]);

  return (
    <>
      {/* Fullscreen button */}
      {setFullscreenContent && tehillimText && (
        <button
          onClick={() => {
            setFullscreenContent({
              isOpen: true,
              title: `Tehillim ${selectedPsalm}`,
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
                    <span className="text-sm platypi-medium text-black">
                      All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy
                    </span>
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
                            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
                              : 'bg-gradient-to-r from-sage to-sage/90 text-white hover:scale-105 transition-transform'
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
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
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
                : 'bg-muted-lavender text-white hover:scale-105 transition-transform'
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

// Jerusalem Compass Component
function JerusalemCompass() {
  const { activeModal, closeModal } = useModalStore();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [direction, setDirection] = useState<number | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<number>(0);
  const [locationName, setLocationName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [orientationSupported, setOrientationSupported] = useState(true);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const orientationEventRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  
  // Android detection for UI elements
  const isAndroid = /Android/i.test(navigator.userAgent);

  // Jerusalem coordinates for fallback (31.7767, 35.2345 as specified)
  const JERUSALEM_LAT = 31.7767;
  const JERUSALEM_LNG = 35.2345;

  // Simple bearing calculation to Jerusalem
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // Enhanced location handling for Android stability
  const getUserLocation = () => {
    setIsLoading(true);
    setError("");
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      setIsLoading(false);
      // Fallback to Jerusalem bearing calculation
      setDirection(0); // Default north when no location available
      return;
    }

    // Enhanced location caching for Android stability
    const cacheKey = 'ezras-nashim-compass-location-v2'; // New cache version
    const cacheTimeKey = 'ezras-nashim-compass-location-time-v2';
    const cachedLocation = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    
    if (cachedLocation && cachedTime) {
      const locationAge = Date.now() - parseInt(cachedTime);
      const maxAge = isAndroid ? 900000 : 300000; // 15 min for Android, 5 min for others
      
      if (locationAge < maxAge) {
        try {
          const parsed = JSON.parse(cachedLocation);
          // Validate cached location
          if (parsed.lat && parsed.lng && 
              Math.abs(parsed.lat) <= 90 && Math.abs(parsed.lng) <= 180) {
            setLocation(parsed);
            const bearing = calculateBearing(parsed.lat, parsed.lng, JERUSALEM_LAT, JERUSALEM_LNG);
            setDirection(bearing);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // Invalid cache, clear it and proceed
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(cacheTimeKey);
        }
      } else {
        // Expired cache, clear it
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheTimeKey);
      }
    }

    // Device detection for geolocation optimization
    const userAgent = navigator.userAgent;
    const isSamsung = /SM-/i.test(userAgent) || /Samsung/i.test(userAgent);
    const isOldIPhone = /iPhone.*OS [5-9]_/i.test(userAgent);
    
    // OPTIMIZED: Device-specific geolocation settings
    const geoOptions = {
      enableHighAccuracy: isSamsung ? false : (isAndroid ? false : true), // Samsung and Android prefer lower accuracy
      timeout: isSamsung ? 15000 : (isAndroid ? 12000 : 8000), // Extra timeout for Samsung devices
      maximumAge: isOldIPhone ? 600000 : (isAndroid ? 300000 : 120000) // Longer cache for older devices
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const locationData = { lat: userLat, lng: userLng };
        setLocation(locationData);
        
        // Enhanced caching for Android reliability
        localStorage.setItem(cacheKey, JSON.stringify(locationData));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
        
        // Store location name for display consistency
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json&addressdetails=1`);
          const data = await response.json();
          const name = data.display_name?.split(',')[0] || `${userLat.toFixed(2)}, ${userLng.toFixed(2)}`;
          setLocationName(name);
          localStorage.setItem('ezras-nashim-compass-location-name', name);
        } catch (e) {
          // Location name fetch failed, use coordinates
          const coordName = `${userLat.toFixed(2)}, ${userLng.toFixed(2)}`;
          setLocationName(coordName);
        }
        
        // Calculate bearing to Jerusalem
        const bearing = calculateBearing(userLat, userLng, JERUSALEM_LAT, JERUSALEM_LNG);
        setDirection(bearing);
        
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = "Unable to get your location. Using default Jerusalem direction.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Showing default Jerusalem direction.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Using compass only.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Using compass only.";
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        // Fallback: show compass without specific bearing
        setDirection(90); // Default east direction to Jerusalem from most places
      },
      geoOptions
    );
  };



  // Get cardinal direction
  const getCardinalDirection = (bearing: number): string => {
    const directions = [
      "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  };

  // Request orientation permission (for iOS 13+)
  const requestOrientationPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionRequested(true);
          initializeOrientation();
        } else {
          setOrientationSupported(false);
          setError("Please enable motion sensors in your device settings");
        }
      } catch (error) {
        setOrientationSupported(false);
        setError("Unable to access motion sensors");
      }
    } else {
      // Not iOS 13+, proceed directly
      setPermissionRequested(true);
      initializeOrientation();
    }
  };

  // Comprehensive orientation handling optimized for all devices
  const initializeOrientation = () => {
    let lastHeading = 0;
    let headingBuffer: number[] = [];
    
    // Enhanced Android detection - covers all versions and browsers
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    const androidVersion = isAndroid ? parseFloat(userAgent.match(/Android ([0-9.]+)/)?.[1] || '0') : 0;
    const isOldAndroid = androidVersion > 0 && androidVersion < 5.0;
    const isModernAndroid = androidVersion >= 5.0;
    const isChrome = /Chrome/i.test(userAgent);
    const isFirefox = /Firefox/i.test(userAgent);
    const isSamsung = /SM-/i.test(userAgent) || /Samsung/i.test(userAgent);
    const isOldIPhone = /iPhone.*OS [5-9]_/i.test(userAgent); // iOS 5-9
    const isModernIPhone = /iPhone.*OS 1[0-9]_/i.test(userAgent); // iOS 10+
    
    // Device-optimized parameters to fix shaking and responsiveness issues
    const BUFFER_SIZE = isOldIPhone ? 5 : (isAndroid ? 8 : 6); // Smaller buffer for old iPhones
    const UPDATE_THRESHOLD = isOldIPhone ? 3.0 : (isSamsung ? 2.5 : 1.8); // Less sensitive for problematic devices
    let lastUpdateTime = Date.now();
    const MIN_UPDATE_INTERVAL = isOldIPhone ? 80 : (isAndroid ? 60 : 40); // Slower updates for old devices
    
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading = 0;
      let isValidHeading = false;
      
      // iOS devices with webkitCompassHeading (most accurate)
      if ((event as any).webkitCompassHeading !== undefined && (event as any).webkitCompassHeading !== null) {
        heading = (event as any).webkitCompassHeading;
        isValidHeading = true;
      }
      // Android and other devices - complex handling for different versions
      else if (event.alpha !== null && event.alpha !== undefined) {
        if (isAndroid) {
          // FIXED: Android compass handling with corrected Samsung logic
          if (isOldAndroid) {
            // Android 4.x and older - use direct alpha but invert
            heading = (360 - event.alpha) % 360;
          } else if (isModernAndroid) {
            if (isChrome && !isSamsung) {
              // Modern Android Chrome (non-Samsung) - alpha handling based on absolute flag
              if (event.absolute) {
                // Absolute orientation available - use alpha directly
                heading = event.alpha;
              } else {
                // Relative orientation - invert alpha
                heading = (360 - event.alpha) % 360;
              }
            } else if (isFirefox) {
              // Firefox on Android - use alpha directly
              heading = event.alpha || 0;
            } else if (isSamsung) {
              // FIXED: Samsung devices - use alpha directly (was incorrectly inverted)
              // Samsung devices report alpha correctly relative to magnetic north
              heading = event.alpha;
            } else {
              // Other Android browsers - use inverted alpha
              heading = (360 - event.alpha) % 360;
            }
          } else {
            // Unknown Android version - default handling
            heading = (360 - event.alpha) % 360;
          }
        } else {
          // Non-Android devices - standard compass calculation
          heading = (360 - event.alpha) % 360;
        }
        
        // Ensure heading is within 0-360 range
        heading = ((heading % 360) + 360) % 360;
        isValidHeading = true;
      } else {
        // Try to get heading from other sources
        if ((event as any).webkitCompassHeading !== undefined) {
          heading = (event as any).webkitCompassHeading || 0;
          isValidHeading = true;
        } else {
          setOrientationSupported(false);
          return;
        }
      }
      
      // Validate heading is reasonable
      if (!isValidHeading || isNaN(heading) || heading < 0 || heading >= 360) {
        return;
      }
      
      // Add to buffer for averaging with circular mean calculation
      headingBuffer.push(heading);
      if (headingBuffer.length > BUFFER_SIZE) {
        headingBuffer.shift();
      }
      
      // Wait for buffer to fill before calculating
      if (headingBuffer.length < 3) { // Start calculating earlier
        return;
      }
      
      // OPTIMIZED: Simplified averaging for better performance on older devices
      let avgHeading;
      if (isOldIPhone) {
        // Simple average for old iPhones to reduce processing load
        const sum = headingBuffer.reduce((acc, h) => acc + h, 0);
        avgHeading = sum / headingBuffer.length;
      } else {
        // Enhanced circular mean for modern devices
        let sinSum = 0;
        let cosSum = 0;
        const weights = headingBuffer.map((_, i) => Math.pow(0.9, headingBuffer.length - 1 - i));
        
        headingBuffer.forEach((h, i) => {
          const radians = (h * Math.PI) / 180;
          const weight = weights[i];
          sinSum += Math.sin(radians) * weight;
          cosSum += Math.cos(radians) * weight;
        });
        
        avgHeading = ((Math.atan2(sinSum, cosSum) * 180) / Math.PI + 360) % 360;
      }
      
      // Check time constraint
      const now = Date.now();
      if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
        return;
      }
      
      // Calculate circular difference for compass headings
      let headingDiff = Math.abs(avgHeading - lastHeading);
      if (headingDiff > 180) {
        headingDiff = 360 - headingDiff;
      }
      
      // Only update if change is significant
      if (headingDiff > UPDATE_THRESHOLD) {
        lastHeading = avgHeading;
        lastUpdateTime = now;
        setDeviceOrientation(Math.round(avgHeading));
      }
    };

    orientationEventRef.current = handleOrientation;
    
    // FIXED: Enhanced event listener setup to prevent conflicts
    const setupEventListeners = () => {
      // Single event listener strategy to prevent conflicts
      let eventType = 'deviceorientation';
      let useAbsolute = false;
      
      if (isAndroid) {
        // Android-specific event handling - prioritize stability
        if (isModernAndroid && 'ondeviceorientationabsolute' in window) {
          // For modern Android, prefer absolute orientation when available
          eventType = 'deviceorientationabsolute';
          useAbsolute = true;
        }
        // For Samsung and older devices, stick with regular deviceorientation
      } else if (!isOldIPhone) {
        // For modern non-Android devices, try absolute if available
        if ('ondeviceorientationabsolute' in window) {
          eventType = 'deviceorientationabsolute';
          useAbsolute = true;
        }
      }
      
      // Add single event listener to prevent conflicts
      try {
        if (useAbsolute) {
          window.addEventListener(eventType, handleOrientation as any, { passive: true });
        } else {
          window.addEventListener(eventType, handleOrientation, { passive: true });
        }
      } catch (e) {
        // Fallback to regular deviceorientation
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
      }
    };
    
    setupEventListeners();
  };

  // Handle device orientation
  useEffect(() => {
    if (activeModal !== 'jerusalem-compass') return;

    getUserLocation();

    // Check if device orientation is supported
    if (typeof DeviceOrientationEvent !== 'undefined') {
      // For iOS 13+, we need user interaction to request permission
      // This will be handled by a button click
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function' && !permissionRequested) {
        // Don't auto-request, wait for user interaction
        setOrientationSupported(true);
      } else {
        // For non-iOS devices or already permitted
        requestOrientationPermission();
      }
    } else {
      setOrientationSupported(false);
    }

    // Enhanced cleanup for Android compatibility
    return () => {
      if (orientationEventRef.current) {
        // Remove all possible event listeners that might have been added
        try {
          window.removeEventListener('deviceorientation', orientationEventRef.current);
          window.removeEventListener('deviceorientationabsolute', orientationEventRef.current as any);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [activeModal, permissionRequested]);

  if (activeModal !== 'jerusalem-compass') return null;

  return (
    <Dialog open={true} onOpenChange={() => closeModal(true)}>
      <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular"
      >
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-6 relative pr-8">
          <DialogTitle className="text-xl platypi-bold text-black mb-2">The Kotel Compass</DialogTitle>
          <p className="platypi-regular text-sm text-black/70">
            Face your Heart Home
          </p>
        </div>

        <div className="space-y-6">

          {/* iOS Permission Request */}
          {typeof (DeviceOrientationEvent as any).requestPermission === 'function' && !permissionRequested && !isLoading && (
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 mb-4">
              <p className="platypi-regular text-sm text-black mb-3">
                To use the compass on iOS, we need your permission to access motion sensors.
              </p>
              <Button
                onClick={requestOrientationPermission}
                className="w-full bg-gradient-feminine text-white py-2 rounded-xl platypi-medium"
              >
                Enable Compass
              </Button>
            </div>
          )}

          {/* Location Status */}
          {isLoading ? (
            <div className="flex flex-col items-center space-y-3 py-8">
              <div className="animate-spin w-8 h-8 border-3 border-blush/20 border-t-blush rounded-full"></div>
              <p className="platypi-regular text-sm text-black/60">Getting your location...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-red-50 rounded-2xl p-4 mb-4">
                <MapPin className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="platypi-regular text-sm text-red-700">{error}</p>
              </div>
              <Button 
                onClick={getUserLocation}
                className="bg-gradient-feminine text-white px-6 py-2 rounded-xl platypi-medium hover:opacity-90"
              >
                Try Again
              </Button>
            </div>
          ) : location && direction !== null ? (
            <div className="space-y-6">
              {/* Compass Container with Proper Containment */}
              <div className="relative w-64 h-64 mx-auto overflow-hidden rounded-full select-none"
                style={{
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                } as React.CSSProperties}
              >
                {/* Rotating Compass Circle */}
                <div 
                  className="w-full h-full rounded-full border-4 border-blush/20 bg-gradient-to-br from-white to-blush/5 shadow-lg relative"
                  style={{ 
                    transform: orientationSupported 
                      ? `rotate(${-deviceOrientation}deg)` 
                      : 'rotate(0deg)',
                    transition: 'transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    willChange: 'transform'
                  }}
                >
                  
                  {/* Cardinal directions - rotate with compass */}
                  <div className="absolute inset-4 rounded-full border border-blush/10">
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 platypi-bold text-sm text-black">N</div>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 platypi-bold text-sm text-black">E</div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 platypi-bold text-sm text-black">S</div>
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 platypi-bold text-sm text-black">W</div>
                  </div>
                  
                  {/* Kotel marker - positioned at calculated bearing, rotates with compass */}
                  <div 
                    className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none"
                    style={{ 
                      transform: `translate(-50%, -50%) rotate(${direction}deg)`,
                      transition: 'transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      willChange: 'transform',
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  >
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                      {(() => {
                        let angleDiff = Math.abs(direction - deviceOrientation);
                        if (angleDiff > 180) {
                          angleDiff = 360 - angleDiff;
                        }
                        const isAligned = angleDiff < 10;
                        
                        return (
                          <div className="w-10 h-10 rounded-full bg-white shadow-md border-2 border-white flex items-center justify-center relative">
                            <img 
                              src={isAligned ? bhGreenIcon : bhPinkIcon}
                              alt={isAligned ? "Aligned" : "Not aligned"}
                              className={`w-8 h-8 ${isAligned ? 'animate-pulse' : ''}`}
                              style={{
                                transform: `rotate(${-direction + deviceOrientation}deg)`,
                                transition: 'transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                willChange: 'transform',
                                animationDuration: isAligned ? '1s' : undefined
                              }}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Fixed arrow pointing up - changes color when aligned */}
                {(() => {
                  let angleDiff = Math.abs(direction - deviceOrientation);
                  if (angleDiff > 180) {
                    angleDiff = 360 - angleDiff;
                  }
                  const isAligned = angleDiff < 10;
                  
                  return (
                    <div className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none" 
                      style={{ 
                        transform: 'translate(-50%, -50%)',
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                    >
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                        <div className="flex flex-col items-center">
                          <ArrowUp className={`w-4 h-4 ${isAligned ? 'text-sage' : 'text-blue-500'}`} strokeWidth={3} />
                          <div className={`w-1 h-16 rounded-full ${isAligned ? 'bg-sage' : 'bg-blue-500'}`}></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Center heart - changes color when aligned */}
                {(() => {
                  let angleDiff = Math.abs(direction - deviceOrientation);
                  if (angleDiff > 180) {
                    angleDiff = 360 - angleDiff;
                  }
                  const isAligned = angleDiff < 10;
                  
                  return (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                      <Heart 
                        className={`w-8 h-8 ${isAligned ? 'animate-pulse' : ''}`}
                        style={{
                          color: '#eacbd2',
                          fill: '#eacbd2',
                          animationDuration: isAligned ? '1s' : undefined
                        }}
                        strokeWidth={0} 
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Alignment Status */}
              {orientationSupported && (() => {
                // For alignment, we need to check if the user (facing north when arrow points up)
                // is actually facing the direction of the Kotel
                // When the compass rotates by -deviceOrientation, north aligns with the top
                // So the user is facing the deviceOrientation direction
                let angleDiff = Math.abs(direction - deviceOrientation);
                if (angleDiff > 180) {
                  angleDiff = 360 - angleDiff;
                }
                const isAligned = angleDiff < 10;
                
                return (
                  <div className={`rounded-2xl p-3 border text-center ${
                    isAligned ? 'bg-sage/20 border-sage' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`platypi-medium text-sm ${
                      isAligned ? 'text-black' : 'text-blue-800'
                    }`}>
                      {isAligned
                        ? '✓ Your heart is in the right place' 
                        : 'Turn until the Icon is at the top'
                      }
                    </p>
                  </div>
                );
              })()}

              {/* Orientation Status */}
              {!orientationSupported && (
                <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-200">
                  <p className="platypi-regular text-xs text-yellow-800">
                    Compass not available on this device. The wall icon shows the direction to face for prayer.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Button 
                onClick={getUserLocation}
                className="bg-gradient-feminine text-white px-6 py-3 rounded-xl platypi-medium hover:opacity-90"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Get My Location
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <h4 className="platypi-bold text-sm text-black mb-2">How to Use:</h4>
            <ol className="platypi-regular text-xs text-black/70 space-y-1">
              <li>1. Allow location access when prompted</li>
              {typeof (DeviceOrientationEvent as any).requestPermission === 'function' && !permissionRequested && (
                <li>2. Tap "Enable Compass" button above for iOS</li>
              )}
              <li>{typeof (DeviceOrientationEvent as any).requestPermission === 'function' && !permissionRequested ? '3' : '2'}. {orientationSupported ? 'Hold device upright and turn your body' : 'Look at the compass to find the Kotel direction'}</li>
              <li>{typeof (DeviceOrientationEvent as any).requestPermission === 'function' && !permissionRequested ? '4' : '3'}. {orientationSupported ? 'The arrow stays fixed while compass rotates' : 'The pink dot shows the Kotel direction'}</li>
              <li>{typeof (DeviceOrientationEvent as any).requestPermission === 'function' && !permissionRequested ? '5' : '4'}. {orientationSupported ? 'Align the pink Kotel marker with the arrow' : 'Face the direction of the pink dot to pray'}</li>
              {isAndroid && orientationSupported && (
                <li className="text-xs text-black/60 mt-2">📱 Android tip: For best accuracy, hold device flat and move in a figure-8 pattern to calibrate</li>
              )}
            </ol>
            
            {/* Android-specific tips */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="platypi-medium text-xs text-black mb-1">
                {/Android/i.test(navigator.userAgent) ? 'Android Tips:' : 'Tips:'}
              </p>
              <ul className="platypi-regular text-xs text-black/60 space-y-1">
                {/Android/i.test(navigator.userAgent) ? (
                  <>
                    <li>• Hold phone flat like a traditional compass</li>
                    <li>• Uses device's magnetic compass sensor</li>
                    <li>• Avoid areas with magnetic interference</li>
                    <li>• Calibrate by moving in figure-8 motion if needed</li>
                  </>
                ) : (
                  <>
                    <li>• Keep device away from metal objects</li>
                    <li>• Works best outdoors or near windows</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <Button
          onClick={() => closeModal(true)}
          className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 mt-4"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
