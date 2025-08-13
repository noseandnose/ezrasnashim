import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { HandHeart, Scroll, Heart, Languages, Type, Plus, Minus, CheckCircle, Calendar, RotateCcw, User, Sparkles, Compass, MapPin, ArrowUp } from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MinchaPrayer, MorningPrayer, NishmasText, GlobalTehillimProgress, TehillimName, WomensPrayer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import axiosClient from "@/lib/axiosClient";
import { useTrackModalComplete, useAnalytics } from "@/hooks/use-analytics";
import { BirkatHamazonModal } from "@/components/modals/birkat-hamazon-modal";
import { useLocationStore } from '@/hooks/use-jewish-times';
import { formatTextContent } from "@/lib/text-formatter";

interface TefillaModalsProps {
  onSectionChange?: (section: any) => void;
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
  <div className="flex items-center justify-center mb-3 relative pr-8">
    <div className="flex items-center gap-4">
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
        {showHebrew ? 'עב' : 'EN'}
      </Button>
      
      <DialogTitle className="text-lg platypi-bold text-black">{title}</DialogTitle>
      
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
function MorningBrochasModal() {
  const { activeModal, closeModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [showHebrew, setShowHebrew] = useState(true);
  const [showEnglish, setShowEnglish] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  
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
        
        {/* Standardized Header with centered controls */}
        <div className="flex items-center justify-center mb-3 relative pr-8">
          <div className="flex items-center gap-4">
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
              {showHebrew ? 'עב' : 'EN'}
            </Button>
            
            <DialogTitle className="text-lg platypi-bold text-black">Morning Brochas</DialogTitle>
            
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
                  {prayer.hebrewText && showHebrew && (
                    <div 
                      className="vc-koren-hebrew leading-relaxed"
                      style={{ fontSize: `${fontSize + 1}px` }}
                      dangerouslySetInnerHTML={{ __html: formatTextContent(prayer.hebrewText).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
                    />
                  )}
                  {!showHebrew && (
                    <div 
                      className="koren-siddur-english text-left leading-relaxed text-black/70"
                      style={{ fontSize: `${fontSize}px` }}
                      dangerouslySetInnerHTML={{ __html: formatTextContent(prayer.englishTranslation || "English translation not available") }}
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

export default function TefillaModals({ onSectionChange }: TefillaModalsProps) {
  const { activeModal, openModal, closeModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const [, setLocation] = useLocation();
  const { trackModalComplete } = useTrackModalComplete();
  const { trackEvent } = useAnalytics();
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [fontSize, setFontSize] = useState(20);
  const [showHebrew, setShowHebrew] = useState(true);
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const queryClient = useQueryClient();

  // Reset explosion state when modal changes
  useEffect(() => {
    setShowExplosion(false);
  }, [activeModal]);

  const handlePrayerSelect = (prayerId: number) => {
    setSelectedPrayerId(prayerId);
    closeModal();
    openModal('individual-prayer', 'tefilla');
  };

  // Complete prayer with task tracking
  const completeWithAnimation = () => {
    // Track modal completion and mark as completed globally
    if (activeModal) {
      trackModalComplete(activeModal);
      markModalComplete(activeModal);
    }
    
    setShowExplosion(true);
    
    // Wait for animation to complete before proceeding
    setTimeout(() => {
      setShowExplosion(false); // Reset explosion state
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
  const { data: progress } = useQuery<GlobalTehillimProgress>({
    queryKey: ['/api/tehillim/progress'], 
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/progress?t=${Date.now()}`);
      const data = await response.json();
      console.log('Fresh progress data:', data);
      return data;
    },
    refetchInterval: 1000, // Very frequent refresh
    enabled: activeModal === 'tehillim-text',
    staleTime: 0, // Always consider stale
    gcTime: 0 // Don't cache at all
  });

  // Fetch current name for the perek
  const { data: currentName } = useQuery<TehillimName | null>({
    queryKey: ['/api/tehillim/current-name'],
    refetchInterval: 2000, // Very frequent refresh for real-time updates
    enabled: activeModal === 'tehillim-text',
    staleTime: 0, // Always consider stale
    gcTime: 0 // Don't cache at all
  });

  // Fetch Tehillim text from Sefaria API
  const { data: tehillimText, refetch: refetchTehillimText } = useQuery<{text: string; perek: number; language: string}>({
    queryKey: ['/api/tehillim/text', progress?.currentPerek, showHebrew ? 'hebrew' : 'english'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/tehillim/text/${progress?.currentPerek}?language=${showHebrew ? 'hebrew' : 'english'}`);
      return response.data;
    },
    enabled: activeModal === 'tehillim-text' && !!progress?.currentPerek,
    refetchInterval: 2000, // Very frequent refresh to get new perek text
    staleTime: 0, // Always consider data stale to force fresh fetches
    gcTime: 0 // Don't cache at all
  });

  // Mutation to complete a perek
  const completePerekMutation = useMutation({
    mutationFn: async () => {
      if (!progress) throw new Error('No progress data');
      return apiRequest('POST', `${import.meta.env.VITE_API_URL}/api/tehillim/complete`, { 
        currentPerek: progress.currentPerek,
        language: showHebrew ? 'hebrew' : 'english',
        completedBy: 'user' 
      });
    },
    onSuccess: () => {
      // Track tehillim completion
      trackEvent("tehillim_complete", { 
        perek: progress?.currentPerek,
        language: showHebrew ? 'hebrew' : 'english'
      });
      
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
        description: `Perek ${progress?.currentPerek || 'current'} has been completed. Moving to the next perek.`,
      });
      // Force complete cache reset for Tehillim data
      queryClient.resetQueries({ queryKey: ['/api/tehillim/progress'] });
      queryClient.resetQueries({ queryKey: ['/api/tehillim/current-name'] });
      queryClient.resetQueries({ queryKey: ['/api/tehillim/text'] });
      queryClient.resetQueries({ queryKey: ['/api/tehillim/preview'] });
      
      // Wait a moment then close modal to trigger fresh data load
      setTimeout(() => {
        closeModal();
      }, 500);
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
        <div className="text-sm text-gray-600 italic text-center">
          Loading Tehillim text from Sefaria...
        </div>
      );
    }

    return (
      <div 
        className={`leading-relaxed whitespace-pre-line ${showHebrew ? 'vc-koren-hebrew text-right' : 'koren-siddur-english text-left'}`}
        style={{ fontSize: `${showHebrew ? fontSize + 1 : fontSize}px` }}
      >
        {tehillimText.text}
      </div>
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
    
    console.log('Completing Nishmas:', { currentDay: nishmasDay, newDay, todayCompleted });
    
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
      
      console.log('Nishmas completed, new state:', { newDay, completed: true });
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
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="tehillim-description">
          <div id="tehillim-description" className="sr-only">Psalms reading and community prayer participation</div>
          
          {/* Standardized Header */}
          <div className="flex items-center justify-center mb-3 relative pr-8">
            <div className="flex items-center gap-4">
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
                {showHebrew ? 'עב' : 'EN'}
              </Button>
              
              <DialogTitle className="text-lg platypi-bold text-black">Tehillim {progress?.currentPerek || 1}</DialogTitle>
              
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

          <KorenThankYou />

          <div className="heart-explosion-container">
            <Button 
              onClick={() => {
                completePerek();
                completeWithAnimation();
              }}
              disabled={completePerekMutation.isPending}
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0"
            >
              {completePerekMutation.isPending ? 'Completing...' : 'Completed'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Mincha Modal */}
      <Dialog open={activeModal === 'mincha'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="mincha-description">
          <div id="mincha-description" className="sr-only">Afternoon prayer service and instructions</div>
          
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
                        dangerouslySetInnerHTML={{ __html: formatTextContent(prayer.hebrewText).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
                      />
                    )}
                    {language === 'english' && (
                      <div 
                        className="koren-siddur-english text-left leading-relaxed text-black/70"
                        style={{ fontSize: `${fontSize}px` }}
                        dangerouslySetInnerHTML={{ __html: formatTextContent(prayer.englishTranslation || "English translation not available") }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('mincha') ? undefined : completeWithAnimation}
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
              className="content-card rounded-xl p-4 cursor-pointer"
              onClick={() => {
                closeModal();
                openModal('blessings', 'tefilla');
              }}
            >
              <div className="flex items-center space-x-3">
                <HandHeart className="text-blush" size={20} />
                <span className="platypi-medium">Blessings</span>
              </div>
            </div>
            
            <div 
              className="content-card rounded-xl p-4 cursor-pointer"
              onClick={() => {
                closeModal();
                openModal('tefillos', 'tefilla');
              }}
            >
              <div className="flex items-center space-x-3">
                <Scroll className="text-peach" size={20} />
                <span className="platypi-medium">Tefillos</span>
              </div>
            </div>
            
            <div 
              className="content-card rounded-xl p-4 cursor-pointer"
              onClick={() => {
                closeModal();
                openModal('personal-prayers', 'tefilla');
              }}
            >
              <div className="flex items-center space-x-3">
                <Heart className="text-blush" size={20} />
                <span className="platypi-medium">Personal Prayers</span>
              </div>
            </div>
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('womens-prayers') ? undefined : completeWithAnimation}
              disabled={isModalComplete('womens-prayers')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('womens-prayers') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
              }`}
            >
              {isModalComplete('womens-prayers') ? 'Completed Today' : "Complete Women's Prayers"}
            </Button>
            <HeartExplosion trigger={showExplosion} />
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
              onClick={isModalComplete('blessings') ? undefined : completeWithAnimation}
              disabled={isModalComplete('blessings')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('blessings') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
              }`}
            >
              {isModalComplete('blessings') ? 'Completed Today' : 'Complete Blessings'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
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
              onClick={isModalComplete('tefillos') ? undefined : completeWithAnimation}
              disabled={isModalComplete('tefillos')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('tefillos') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
              }`}
            >
              {isModalComplete('tefillos') ? 'Completed Today' : 'Complete Tefillos'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Personal Prayers Modal */}
      <Dialog open={activeModal === 'personal-prayers'} onOpenChange={() => closeModal(true)}>
        <DialogContent className={`w-full max-w-md rounded-3xl p-6 max-h-[90vh] platypi-regular ${isAnimating ? 'prayer-ascending' : ''}`} aria-describedby="personal-prayers-description">
          <div id="personal-prayers-description" className="sr-only">Guidance for personal prayer and connection</div>
          
          <StandardModalHeader 
            title="Personal Prayers"
            showHebrew={showHebrew}
            setShowHebrew={setShowHebrew}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          


          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('personal-prayers') ? undefined : completeWithAnimation}
              disabled={isModalComplete('personal-prayers')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('personal-prayers') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
              }`}
            >
              {isModalComplete('personal-prayers') ? 'Completed Today' : 'Complete Personal Prayers'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Nishmas Kol Chai Modal */}
      <Dialog open={activeModal === 'nishmas-campaign'} onOpenChange={() => closeModal(true)}>
        <DialogContent className={`w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular ${isAnimating ? 'prayer-ascending' : ''}`}>
          {/* Standardized Header */}
          <div className="flex items-center justify-center mb-3 relative pr-8">
            <div className="flex items-center gap-4">
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
                {nishmasLanguage === 'hebrew' ? 'עב' : 'EN'}
              </Button>
              
              <DialogTitle className="text-lg platypi-bold text-black">Nishmas Kol Chai</DialogTitle>
              
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
                        (nishmasText as any)?.fullText || nishmasText.fullText || 'Text not available'
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

          <KorenThankYou />

          {/* Complete Button */}
          <div className="heart-explosion-container">
            <Button 
              onClick={completeWithAnimation} 
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
          <IndividualPrayerContent prayerId={selectedPrayerId} language={language} fontSize={fontSize} setLanguage={setLanguage} setFontSize={setFontSize} />
        </DialogContent>
      </Dialog>

      {/* Special Tehillim Modal */}
      <Dialog open={activeModal === 'special-tehillim'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
          <SpecialTehillimModal />
        </DialogContent>
      </Dialog>

      {/* Individual Tehillim Modal */}
      <Dialog open={activeModal === 'individual-tehillim'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
          <IndividualTehillimModal />
        </DialogContent>
      </Dialog>

      {/* Maariv Modal */}
      <Dialog open={activeModal === 'maariv'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="maariv-description">
          <div id="maariv-description" className="sr-only">Evening prayer service and instructions</div>
          
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
                        dangerouslySetInnerHTML={{ __html: formatTextContent(prayer.hebrewText).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
                      />
                    )}
                    {language === 'english' && (
                      <div 
                        className="koren-siddur-english text-left leading-relaxed text-black/70"
                        style={{ fontSize: `${fontSize}px` }}
                        dangerouslySetInnerHTML={{ __html: formatTextContent(prayer.englishTranslation || "English translation not available") }}
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
              onClick={isModalComplete('maariv') ? undefined : completeWithAnimation}
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
      <MorningBrochasModal />
      
      {/* Birkat Hamazon Modal */}
      <BirkatHamazonModal />
      
      {/* Jerusalem Compass Modal */}
      <JerusalemCompass />
    </>
  );
}

// Helper components for prayer modals

// Helper components for prayer lists
function RefuahPrayersList({ onPrayerSelect }: { onPrayerSelect: (id: number) => void }) {
  const { closeModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
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
          className="content-card rounded-xl p-4 cursor-pointer"
          onClick={() => onPrayerSelect(prayer.id)}
        >
          <div className="flex items-center space-x-3">
            <Heart className="text-blush" size={20} />
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
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
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
          className="content-card rounded-xl p-4 cursor-pointer"
          onClick={() => onPrayerSelect(prayer.id)}
        >
          <div className="flex items-center space-x-3">
            <HandHeart className="text-peach" size={20} />
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
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
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
          className="content-card rounded-xl p-4 cursor-pointer"
          onClick={() => onPrayerSelect(prayer.id)}
        >
          <div className="flex items-center space-x-3">
            <Scroll className="text-sage" size={20} />
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

function IndividualPrayerContent({ prayerId, language, fontSize, setLanguage, setFontSize }: {
  prayerId: number | null;
  language: 'hebrew' | 'english';
  fontSize: number;
  setLanguage: (lang: 'hebrew' | 'english') => void;
  setFontSize: (size: number) => void;
}) {
  const { closeModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const { data: prayer, isLoading } = useQuery<WomensPrayer>({
    queryKey: [`/api/womens-prayers/prayer/${prayerId}`],
    enabled: !!prayerId,
  });

  if (isLoading) return <div className="text-center">Loading prayer...</div>;
  if (!prayer) return <div className="text-center">Prayer not found</div>;

  return (
    <>
      <VisuallyHidden>
        <DialogTitle>{prayer.prayerName}</DialogTitle>
      </VisuallyHidden>
      
      {/* Standardized Header */}
      <div className="flex items-center justify-center mb-3 relative pr-8">
        <div className="flex items-center gap-4">
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
            {language === 'hebrew' ? 'עב' : 'EN'}
          </Button>
          
          <h2 className="text-lg platypi-bold text-black">{prayer.prayerName}</h2>
          
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
          className={`${language === 'hebrew' ? 'vc-koren-hebrew' : 'koren-siddur-english'} leading-relaxed text-black`}
          style={{ fontSize: `${language === 'hebrew' ? fontSize + 1 : fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: formatTextContent(language === 'hebrew' ? prayer.hebrewText : prayer.englishTranslation).replace(/<strong>/g, '<strong class="vc-koren-hebrew-bold">') }}
        />

      </div>

      <KorenThankYou />

      <div className="heart-explosion-container">
        <Button 
          onClick={isModalComplete('individual-prayer') ? undefined : () => {
            // Track modal completion and mark as completed globally
            trackModalComplete('individual-prayer');
            markModalComplete('individual-prayer');
            
            completeTask('tefilla');
            setShowHeartExplosion(true);
            
            setTimeout(() => {
              setShowHeartExplosion(false); // Reset explosion state
              checkAndShowCongratulations();
              closeModal();
              window.location.hash = '#/?section=home&scrollToProgress=true';
            }, 2000);
          }}
          disabled={isModalComplete('individual-prayer')}
          className={`w-full py-3 rounded-xl platypi-medium border-0 ${
            isModalComplete('individual-prayer') 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
          }`}
        >
          {isModalComplete('individual-prayer') ? 'Completed Today' : 'Complete'}
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

// Special Tehillim Modal Component
function SpecialTehillimModal() {
  const { closeModal, openModal, setSelectedPsalm } = useModalStore();

  // Open individual Tehillim text
  const openTehillimText = (psalmNumber: number) => {
    setSelectedPsalm(psalmNumber);
    closeModal();
    openModal('individual-tehillim', 'tefilla');
  };

  // Categories with psalm numbers
  const categories = [
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
        <DialogTitle className="text-lg platypi-semibold text-black">Special Tehillim</DialogTitle>
        <DialogDescription className="text-xs text-black/70">
          Specific psalms for different needs and occasions
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[60vh] overflow-y-auto space-y-3">
        {categories.map((category, index) => (
          <div key={index} className="bg-white/80 rounded-2xl p-3 border border-blush/10">
            <h3 className="platypi-bold text-sm text-black mb-2">{category.title}</h3>
            <div className="flex flex-wrap gap-2">
              {category.psalms.map((psalm) => (
                <button
                  key={psalm}
                  onClick={() => openTehillimText(psalm)}
                  className="bg-gradient-feminine text-white px-3 py-1 rounded-xl text-sm platypi-medium hover:opacity-90 transition-opacity"
                >
                  {psalm}
                </button>
              ))}
            </div>
          </div>
        ))}
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
function IndividualTehillimModal() {
  const { closeModal, selectedPsalm } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [fontSize, setFontSize] = useState(20);
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);

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

  return (
    <>
      {/* Standardized Header */}
      <div className="flex items-center justify-center mb-3 relative pr-8">
        <div className="flex items-center gap-4">
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
            {language === 'hebrew' ? 'עב' : 'EN'}
          </Button>
          
          <DialogTitle className="text-lg platypi-bold text-black">Tehillim {selectedPsalm}</DialogTitle>
          
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div
            className={`${language === 'hebrew' ? 'vc-koren-hebrew' : 'koren-siddur-english text-left'} leading-relaxed text-black`}
            style={{ fontSize: `${language === 'hebrew' ? fontSize + 1 : fontSize}px` }}
          >
            {tehillimText?.text || `Psalm ${selectedPsalm} text loading...`}
          </div>
        )}
      </div>

      <KorenThankYou />

      <Button 
        onClick={isModalComplete(`individual-tehillim-${selectedPsalm}`) ? undefined : () => {
          // Track modal completion and mark as completed globally with specific psalm ID
          trackModalComplete(`individual-tehillim-${selectedPsalm}`);
          markModalComplete(`individual-tehillim-${selectedPsalm}`);
          
          completeTask('tefilla');
          setShowHeartExplosion(true);
          
          setTimeout(() => {
            setShowHeartExplosion(false); // Reset explosion state
            checkAndShowCongratulations();
            closeModal();
            window.location.hash = '#/?section=home&scrollToProgress=true';
          }, 2000);
        }}
        disabled={isModalComplete(`individual-tehillim-${selectedPsalm}`)}
        className={`w-full py-3 rounded-xl platypi-medium border-0 ${
          isModalComplete(`individual-tehillim-${selectedPsalm}`) 
            ? 'bg-sage text-white cursor-not-allowed opacity-70' 
            : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
        }`}
      >
        {isModalComplete(`individual-tehillim-${selectedPsalm}`) ? 'Completed Today' : 'Complete'}
      </Button>
      
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

  // Western Wall (Kotel) coordinates - verified accurate location
  const WESTERN_WALL_LAT = 31.7781;
  const WESTERN_WALL_LNG = 35.2346;

  // Calculate bearing to Western Wall - fixed calculation
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    // Convert to radians
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    // Calculate bearing using proper formula
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    // Convert to degrees and normalize
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-360
    
    console.log(`Bearing calculation: From (${lat1}, ${lng1}) to (${lat2}, ${lng2}) = ${bearing}°`);
    return bearing;
  };

  // Get user's location
  const getUserLocation = () => {
    setIsLoading(true);
    setError("");
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        setLocation({ lat: userLat, lng: userLng });
        
        // Calculate direction to Western Wall
        const bearing = calculateBearing(userLat, userLng, WESTERN_WALL_LAT, WESTERN_WALL_LNG);
        setDirection(bearing);
        console.log(`Set direction to: ${bearing}°`);
        
        // Get location name using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&accept-language=en`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Unknown location";
          const country = data.address?.country || "";
          setLocationName(`${city}, ${country}`);
        } catch (err) {
          setLocationName(`${userLat.toFixed(4)}, ${userLng.toFixed(4)}`);
        }
        
        setIsLoading(false);
      },
      (error) => {
        setError("Unable to get your location. Please enable location access.");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
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

  // Handle device orientation
  useEffect(() => {
    if (activeModal !== 'jerusalem-compass') return;

    getUserLocation();

    // Check if device orientation is supported
    if (typeof DeviceOrientationEvent !== 'undefined') {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        // Get compass heading (alpha gives us the rotation around z-axis)
        if (event.alpha !== null) {
          // For a proper compass, we need to invert alpha
          // as alpha increases when rotating clockwise, but compass degrees increase counter-clockwise
          let heading = 360 - event.alpha;
          
          // Use webkitCompassHeading if available (iOS)
          if ((event as any).webkitCompassHeading !== undefined && (event as any).webkitCompassHeading !== null) {
            heading = (event as any).webkitCompassHeading;
          }
          
          setDeviceOrientation(heading % 360);
        }
      };

      // Request permission for iOS 13+
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            } else {
              setOrientationSupported(false);
            }
          })
          .catch(() => setOrientationSupported(false));
      } else {
        // For non-iOS devices
        window.addEventListener('deviceorientation', handleOrientation);
      }

      // Cleanup
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    } else {
      setOrientationSupported(false);
    }
  }, [activeModal]);

  if (activeModal !== 'jerusalem-compass') return null;

  return (
    <Dialog open={true} onOpenChange={() => closeModal(true)}>
      <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular"
      >
        
        {/* Header */}
        <div className="flex items-center justify-center mb-4 relative pr-8">
          <DialogTitle className="text-xl platypi-bold text-black">Western Wall Compass</DialogTitle>
        </div>

        <div className="space-y-6">
          {/* Description */}
          <div className="text-center">
            <p className="platypi-regular text-sm text-black/70 mb-4">
              Find the direction to face when praying towards the Western Wall
            </p>
          </div>

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
          ) : direction !== null ? (
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
                    transition: 'transform 0.3s ease'
                  }}
                >
                  
                  {/* Cardinal directions - rotate with compass */}
                  <div className="absolute inset-4 rounded-full border border-blush/10">
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 platypi-bold text-sm text-black">N</div>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 platypi-bold text-sm text-black">E</div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 platypi-bold text-sm text-black">S</div>
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 platypi-bold text-sm text-black">W</div>
                  </div>
                  
                  {/* Western Wall marker - positioned at calculated bearing, rotates with compass */}
                  <div 
                    className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none"
                    style={{ 
                      transform: `translate(-50%, -50%) rotate(${direction}deg)`,
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
                          <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md ${
                            isAligned ? 'bg-sage' : 'bg-blush'
                          }`}></div>
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
                          <div className={`text-xs platypi-bold mt-1 ${isAligned ? 'text-sage' : 'text-blue-600'}`}>YOU</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Center dot */}
                {(() => {
                  let angleDiff = Math.abs(direction - deviceOrientation);
                  if (angleDiff > 180) {
                    angleDiff = 360 - angleDiff;
                  }
                  const isAligned = angleDiff < 10;
                  
                  return (
                    <div className={`absolute top-1/2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20 ${
                      isAligned ? 'bg-sage' : 'bg-blush'
                    }`}></div>
                  );
                })()}
              </div>

              {/* Alignment Status */}
              {orientationSupported && (() => {
                // For alignment, we need to check if the user (facing north when arrow points up)
                // is actually facing the direction of the Western Wall
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
                        ? '✓ Aligned!' 
                        : 'Turn until the wall icon is at the top'
                      }
                    </p>
                  </div>
                );
              })()}

              {/* Orientation Status */}
              {!orientationSupported && (
                <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-200">
                  <p className="platypi-regular text-xs text-yellow-800">
                    Device orientation not available. Face the direction where the wall icon appears on the circle.
                  </p>
                </div>
              )}

              {/* Direction Info */}
              <div className="bg-gradient-soft rounded-2xl p-4 text-center">
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Compass className="w-5 h-5 text-blush" />
                    <span className="platypi-bold text-lg text-black">
                      {getCardinalDirection(direction)} ({Math.round(direction)}°)
                    </span>
                  </div>
                  <p className="platypi-regular text-sm text-black/70">Direction to the Western Wall</p>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-white rounded-2xl p-3 border border-blush/10">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blush flex-shrink-0" />
                  <div>
                    <p className="platypi-medium text-sm text-black">Your Location</p>
                    <p className="platypi-regular text-xs text-black/60">{locationName}</p>
                  </div>
                </div>
              </div>
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
              <li>2. {orientationSupported ? 'Hold device upright and turn your body' : 'Face the direction where the wall icon appears on the circle'}</li>
              <li>3. {orientationSupported ? 'The blue "YOU" arrow moves as you turn' : 'The wall icon shows the prayer direction'}</li>
              <li>4. {orientationSupported ? 'When the blue arrow points directly to the wall icon, you\'re aligned' : 'Face toward the wall icon for prayer'}</li>
            </ol>
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
