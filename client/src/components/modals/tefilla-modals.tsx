import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { HandHeart, Scroll, Heart, Languages, Type, Plus, Minus, CheckCircle, Calendar, RotateCcw, User, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MinchaPrayer, NishmasText, GlobalTehillimProgress, TehillimName, WomensPrayer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import axiosClient from "@/lib/axiosClient";

interface TefillaModalsProps {
  onSectionChange?: (section: any) => void;
}

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
  <div className="flex items-center justify-center mb-3 relative">
    <div className="flex items-center gap-4">
      <Button
        onClick={() => setShowHebrew(!showHebrew)}
        variant="ghost"
        size="sm"
        className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
          showHebrew 
            ? 'bg-blush text-white' 
            : 'text-black/60 hover:text-black hover:bg-white/50'
        }`}
      >
        {showHebrew ? 'עב' : 'EN'}
      </Button>
      
      <DialogTitle className="text-lg font-serif font-bold text-black">{title}</DialogTitle>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFontSize(Math.max(12, fontSize - 2))}
          className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
        >
          <span className="text-xs font-medium">-</span>
        </button>
        <span className="text-xs font-medium text-black/70 w-6 text-center">{fontSize}</span>
        <button
          onClick={() => setFontSize(Math.min(32, fontSize + 2))}
          className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
        >
          <span className="text-xs font-medium">+</span>
        </button>
      </div>
    </div>
  </div>
);

// Morning Brochas Modal Component
function MorningBrochasModal() {
  const { activeModal, closeModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [showHebrew, setShowHebrew] = useState(true);
  const [showEnglish, setShowEnglish] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  
  // Sefaria API URLs for morning blessings
  // Fetch all morning blessing texts from backend proxy
  const { data: morningBlessings, isLoading, error } = useQuery({
    queryKey: ['morning-blessings-fixed-format-v2'],
    queryFn: async () => {
      console.log('Making API call for morning blessings...');
      const response = await axiosClient.get('/api/sefaria/morning-brochas');
      console.log('Frontend received response:', response.data);
      console.log('Number of blessings:', response.data?.length);
      console.log('First blessing sample:', response.data?.[0]);
      return response.data; // Returns array of {hebrew, english, ref} objects
    },
    enabled: activeModal === 'morning-brochas',
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0 // Completely disable caching
  });

  console.log('MorningBrochasModal - activeModal:', activeModal);
  console.log('MorningBrochasModal - isLoading:', isLoading);
  console.log('MorningBrochasModal - error:', error);
  console.log('MorningBrochasModal - data:', morningBlessings);

  console.log('MorningBrochasModal - activeModal:', activeModal);
  
  return (
    <Dialog open={activeModal === 'morning-brochas'} onOpenChange={() => closeModal()}>
      <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-hidden font-sans" aria-describedby="morning-brochas-description">
        <div id="morning-brochas-description" className="sr-only">Daily morning blessings and prayers of gratitude</div>
        
        {/* Standardized Header with centered controls */}
        <div className="flex items-center justify-center mb-3 relative">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowHebrew(!showHebrew)}
              variant="ghost"
              size="sm"
              className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
                showHebrew 
                  ? 'bg-blush text-white' 
                  : 'text-black/60 hover:text-black hover:bg-white/50'
              }`}
            >
              {showHebrew ? 'עב' : 'EN'}
            </Button>
            
            <DialogTitle className="text-lg font-serif font-bold text-black">Morning Brochas</DialogTitle>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
              >
                <span className="text-xs font-medium">-</span>
              </button>
              <span className="text-xs font-medium text-black/70 w-6 text-center">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
              >
                <span className="text-xs font-medium">+</span>
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Prayer Content Area */}
        <div className="bg-white rounded-2xl p-6 mb-3 shadow-sm border border-warm-gray/10 max-h-[65vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-6" style={{ fontSize: `${fontSize}px` }}>
              {morningBlessings?.map((blessing: any, index: number) => (
                <div key={index} className="space-y-3 border-b border-warm-gray/10 pb-4 last:border-b-0">
                  {blessing.hebrew && showHebrew && (
                    <div className="secular-one-bold text-right leading-relaxed text-black">
                      {blessing.hebrew}
                    </div>
                  )}
                  {!showHebrew && (
                    <div className="text-left leading-relaxed text-black/70">
                      {blessing.english || "English translation not available"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={() => {
            completeTask('tefilla');
            setShowHeartExplosion(true);
            
            setTimeout(() => {
              checkAndShowCongratulations();
              closeModal();
              window.location.hash = '#/';
            }, 2000);
          }} 
          className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0"
          disabled={isLoading}
        >
          Complete Morning Brochas
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
  const [, setLocation] = useLocation();
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
    openModal('individual-prayer');
  };

  // Complete prayer with task tracking
  const completeWithAnimation = () => {
    setShowExplosion(true);
    
    // Wait for animation to complete before proceeding
    setTimeout(() => {
      setShowExplosion(false); // Reset explosion state
      completeTask('tefilla');
      closeModal();
      
      // Navigate to home section to show progress
      if (onSectionChange) {
        onSectionChange('home');
      }
      
      // Check if all tasks are completed and show congratulations
      setTimeout(() => {
        if (checkAndShowCongratulations()) {
          openModal('congratulations');
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

  const { data: minchaPrayers = [], isLoading } = useQuery<MinchaPrayer[]>({
    queryKey: ['/api/mincha/prayers'],
    enabled: activeModal === 'mincha'
  });

  // Fetch Nishmas text from database
  const { data: nishmasText, isLoading: nishmasLoading } = useQuery<NishmasText>({
    queryKey: [`/api/nishmas/${nishmasLanguage}`],
    enabled: activeModal === 'nishmas-campaign'
  });

  // Fetch global Tehillim progress
  const { data: progress } = useQuery<GlobalTehillimProgress>({
    queryKey: ['/api/tehillim/progress'],
    refetchInterval: 30000,
    enabled: activeModal === 'tehillim-text'
  });

  // Fetch current name for the perek
  const { data: currentName } = useQuery<TehillimName | null>({
    queryKey: ['/api/tehillim/current-name'],
    refetchInterval: 10000,
    enabled: activeModal === 'tehillim-text'
  });

  // Fetch Tehillim text from Sefaria API
  const { data: tehillimText } = useQuery<{text: string; perek: number; language: string}>({
    queryKey: ['/api/tehillim/text', progress?.currentPerek, showHebrew ? 'hebrew' : 'english'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/tehillim/text/${progress?.currentPerek}?language=${showHebrew ? 'hebrew' : 'english'}`);
      return response.data;
    },
    enabled: activeModal === 'tehillim-text' && !!progress?.currentPerek
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
      toast({
        title: "Perek Completed!",
        description: `Perek ${progress?.currentPerek || 'current'} has been completed. Moving to the next perek.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
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
        className={`leading-relaxed whitespace-pre-line ${showHebrew ? 'text-right secular-one-bold' : 'font-english text-left'}`}
        style={{ fontSize: `${fontSize}px` }}
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
      <Dialog open={activeModal === 'tehillim-text'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] font-sans" aria-describedby="tehillim-description">
          <div id="tehillim-description" className="sr-only">Psalms reading and community prayer participation</div>
          
          {/* Standardized Header */}
          <div className="flex items-center justify-center mb-3 relative">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowHebrew(!showHebrew)}
                variant="ghost"
                size="sm"
                className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
                  showHebrew 
                    ? 'bg-blush text-white' 
                    : 'text-black/60 hover:text-black hover:bg-white/50'
                }`}
              >
                {showHebrew ? 'עב' : 'EN'}
              </Button>
              
              <DialogTitle className="text-lg font-serif font-bold text-black">Tehillim {progress?.currentPerek || 1}</DialogTitle>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs text-black/60 font-medium">{fontSize}px</span>
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
          <div className="bg-white rounded-2xl p-6 mb-3 shadow-sm border border-warm-gray/10 max-h-[65vh] overflow-y-auto">
            <div
              className={`${showHebrew ? 'secular-one-bold text-right' : 'font-english'} leading-relaxed text-black`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {getTehillimDisplayText()}
            </div>
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={() => {
                completePerek();
                completeWithAnimation();
              }}
              disabled={completePerekMutation.isPending}
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0"
            >
              {completePerekMutation.isPending ? 'Completing...' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Mincha Modal */}
      <Dialog open={activeModal === 'mincha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-hidden font-sans" aria-describedby="mincha-description">
          <div id="mincha-description" className="sr-only">Afternoon prayer service and instructions</div>
          
          <StandardModalHeader 
            title="Mincha Prayer"
            showHebrew={language === 'hebrew'}
            setShowHebrew={(show) => setLanguage(show ? 'hebrew' : 'english')}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />

          <div className="bg-white rounded-2xl p-6 mb-3 shadow-sm border border-warm-gray/10 max-h-[65vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-6" style={{ fontSize: `${fontSize}px` }}>
                {minchaPrayers.map((prayer) => (
                  <div key={prayer.id} className="border-b border-warm-gray/10 pb-4 last:border-b-0">
                    <div
                      className={`${language === 'hebrew' ? 'secular-one-bold text-right' : 'text-left'} leading-relaxed whitespace-pre-line text-black`}
                      dangerouslySetInnerHTML={{
                        __html: language === 'hebrew' 
                          ? (prayer.hebrewText || '')
                              .replace(/\*\*(.*?)\*\*\n\n/g, '**$1**\n')
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="prayer-header">$1</strong>')
                          : prayer.englishTranslation
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={completeWithAnimation} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Women's Prayers Modal */}
      <Dialog open={activeModal === 'womens-prayers'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-hidden font-sans" aria-describedby="womens-prayers-description">
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
                openModal('blessings');
              }}
            >
              <div className="flex items-center space-x-3">
                <HandHeart className="text-blush" size={20} />
                <span className="font-sans font-medium">Blessings</span>
              </div>
            </div>
            
            <div 
              className="content-card rounded-xl p-4 cursor-pointer"
              onClick={() => {
                closeModal();
                openModal('tefillos');
              }}
            >
              <div className="flex items-center space-x-3">
                <Scroll className="text-peach" size={20} />
                <span className="font-sans font-medium">Tefillos</span>
              </div>
            </div>
            
            <div 
              className="content-card rounded-xl p-4 cursor-pointer"
              onClick={() => {
                closeModal();
                openModal('personal-prayers');
              }}
            >
              <div className="flex items-center space-x-3">
                <Heart className="text-blush" size={20} />
                <span className="font-sans font-medium">Personal Prayers</span>
              </div>
            </div>
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={completeWithAnimation} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Blessings Modal */}
      <Dialog open={activeModal === 'blessings'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] font-sans" aria-describedby="blessings-description">
          <div id="blessings-description" className="sr-only">Daily blessings and their proper recitation</div>
          
          <StandardModalHeader 
            title="Blessings"
            showHebrew={showHebrew}
            setShowHebrew={setShowHebrew}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          
          <div className="text-center text-gray-600 font-sans">
            Daily blessings and their proper recitation...
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={completeWithAnimation} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Tefillos Modal */}
      <Dialog open={activeModal === 'tefillos'} onOpenChange={() => closeModal()}>
        <DialogContent className={`w-full max-w-md rounded-3xl p-6 max-h-[90vh] font-sans ${isAnimating ? 'prayer-ascending' : ''}`} aria-describedby="tefillos-description">
          <div id="tefillos-description" className="sr-only">Traditional prayers and their meanings</div>
          
          <StandardModalHeader 
            title="Tefillos"
            showHebrew={showHebrew}
            setShowHebrew={setShowHebrew}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          
          <div className="text-center text-gray-600 font-sans">
            Traditional prayers and their meanings...
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={completeWithAnimation} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Personal Prayers Modal */}
      <Dialog open={activeModal === 'personal-prayers'} onOpenChange={() => closeModal()}>
        <DialogContent className={`w-full max-w-md rounded-3xl p-6 max-h-[90vh] font-sans ${isAnimating ? 'prayer-ascending' : ''}`} aria-describedby="personal-prayers-description">
          <div id="personal-prayers-description" className="sr-only">Guidance for personal prayer and connection</div>
          
          <StandardModalHeader 
            title="Personal Prayers"
            showHebrew={showHebrew}
            setShowHebrew={setShowHebrew}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          
          <div className="text-center text-gray-600 font-sans">
            Guidance for personal prayer and connection...
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={completeWithAnimation} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Nishmas Kol Chai Modal */}
      <Dialog open={activeModal === 'nishmas-campaign'} onOpenChange={() => closeModal()}>
        <DialogContent className={`w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto font-sans ${isAnimating ? 'prayer-ascending' : ''}`}>
          {/* Standardized Header */}
          <div className="flex items-center justify-center mb-3 relative">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setNishmasLanguage(nishmasLanguage === 'hebrew' ? 'english' : 'hebrew')}
                variant="ghost"
                size="sm"
                className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
                  nishmasLanguage === 'hebrew' 
                    ? 'bg-blush text-white' 
                    : 'text-black/60 hover:text-black hover:bg-white/50'
                }`}
              >
                {nishmasLanguage === 'hebrew' ? 'עב' : 'EN'}
              </Button>
              
              <DialogTitle className="text-lg font-serif font-bold text-black">Nishmas Kol Chai</DialogTitle>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNishmasFontSize(Math.max(12, nishmasFontSize - 2))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs text-black/60 font-medium">{nishmasFontSize}px</span>
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
          <div className="bg-white rounded-2xl p-6 mb-3 shadow-sm border border-warm-gray/10 max-h-[65vh] overflow-y-auto">
            {nishmasLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div 
                className={`leading-relaxed text-black ${
                  nishmasLanguage === 'hebrew' ? 'text-right secular-one-bold' : 'font-english text-left'
                }`} 
                style={{ fontSize: `${nishmasFontSize}px` }}
              >
                {nishmasText ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {(nishmasText as any)?.fullText || nishmasText.fullText || 'Text not available'}
                  </div>
                ) : (
                  <div className="text-red-600 text-center">Failed to load prayer text</div>
                )}
              </div>
            )}
          </div>

          {/* Complete Button */}
          <div className="heart-explosion-container">
            <Button 
              onClick={completeWithAnimation} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-3 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>

          {/* Special Thanks Section */}
          <div className="text-xs text-gray-500 mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <p className="mb-2 font-medium text-gray-700">
              Special thanks to Nishmas.net
            </p>
            <p className="mb-2">
              For providing the complete prayer text and authentic sources
            </p>
            <a 
              href="https://nishmas.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              Visit Nishmas.net
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Rebbetzin Kanievsky Quote */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            <p className="leading-relaxed">
              Rebbetzin Leah Kolodetsky shared that her mother, Rebbetzin Kanievsky zt"l, believed reciting Nishmas Kol Chai for 40 consecutive days is a powerful segulah for having prayers answered.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      {/* Refuah Prayers Modal */}
      <Dialog open={activeModal === 'refuah'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 font-sans">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Refuah Prayers</DialogTitle>
          </div>
          <RefuahPrayersList onPrayerSelect={handlePrayerSelect} />
        </DialogContent>
      </Dialog>
      {/* Family Prayers Modal */}
      <Dialog open={activeModal === 'family'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 font-sans">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Family Prayers</DialogTitle>
          </div>
          <FamilyPrayersList onPrayerSelect={handlePrayerSelect} />
        </DialogContent>
      </Dialog>
      {/* Life Prayers Modal */}
      <Dialog open={activeModal === 'life'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 font-sans">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Life Prayers</DialogTitle>
          </div>
          <LifePrayersList onPrayerSelect={handlePrayerSelect} />
        </DialogContent>
      </Dialog>
      {/* Individual Prayer Modal */}
      <Dialog open={activeModal === 'individual-prayer'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto font-sans">
          <IndividualPrayerContent prayerId={selectedPrayerId} language={language} fontSize={fontSize} setLanguage={setLanguage} setFontSize={setFontSize} />
        </DialogContent>
      </Dialog>

      {/* Special Tehillim Modal */}
      <Dialog open={activeModal === 'special-tehillim'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto font-sans">
          <SpecialTehillimModal />
        </DialogContent>
      </Dialog>

      {/* Individual Tehillim Modal */}
      <Dialog open={activeModal === 'individual-tehillim'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto font-sans">
          <IndividualTehillimModal />
        </DialogContent>
      </Dialog>

      {/* Morning Brochas Modal */}
      <MorningBrochasModal />
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

  return (
    <div className="space-y-3">
      {prayers?.map((prayer) => (
        <div 
          key={prayer.id}
          className="content-card rounded-xl p-4 cursor-pointer"
          onClick={() => onPrayerSelect(prayer.id)}
        >
          <div className="flex items-center space-x-3">
            <Heart className="text-blush" size={20} />
            <div>
              <span className="font-sans font-medium">{prayer.prayerName}</span>
              {prayer.description && (
                <p className="text-xs text-warm-gray/60 mt-1">{prayer.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button 
        onClick={() => closeModal()} 
        className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
      >
        Close
      </Button>
    </div>
  );
}

function FamilyPrayersList({ onPrayerSelect }: { onPrayerSelect: (id: number) => void }) {
  const { closeModal } = useModalStore();
  const { data: prayers, isLoading } = useQuery<WomensPrayer[]>({
    queryKey: ['/api/womens-prayers/family'],
  });

  if (isLoading) return <div className="text-center">Loading prayers...</div>;

  return (
    <div className="space-y-3">
      {prayers?.map((prayer) => (
        <div 
          key={prayer.id}
          className="content-card rounded-xl p-4 cursor-pointer"
          onClick={() => onPrayerSelect(prayer.id)}
        >
          <div className="flex items-center space-x-3">
            <HandHeart className="text-peach" size={20} />
            <div>
              <span className="font-sans font-medium">{prayer.prayerName}</span>
              {prayer.description && (
                <p className="text-xs text-warm-gray/60 mt-1">{prayer.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button 
        onClick={() => closeModal()} 
        className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
      >
        Close
      </Button>
    </div>
  );
}

function LifePrayersList({ onPrayerSelect }: { onPrayerSelect: (id: number) => void }) {
  const { closeModal } = useModalStore();
  const { data: prayers, isLoading } = useQuery<WomensPrayer[]>({
    queryKey: ['/api/womens-prayers/life'],
  });

  if (isLoading) return <div className="text-center">Loading prayers...</div>;

  return (
    <div className="space-y-3">
      {prayers?.map((prayer) => (
        <div 
          key={prayer.id}
          className="content-card rounded-xl p-4 cursor-pointer"
          onClick={() => onPrayerSelect(prayer.id)}
        >
          <div className="flex items-center space-x-3">
            <Scroll className="text-sage" size={20} />
            <div>
              <span className="font-sans font-medium">{prayer.prayerName}</span>
              {prayer.description && (
                <p className="text-xs text-warm-gray/60 mt-1">{prayer.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button 
        onClick={() => closeModal()} 
        className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
      >
        Close
      </Button>
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
  const { data: prayer, isLoading } = useQuery<WomensPrayer>({
    queryKey: [`/api/womens-prayers/prayer/${prayerId}`],
    enabled: !!prayerId,
  });

  if (isLoading) return <div className="text-center">Loading prayer...</div>;
  if (!prayer) return <div className="text-center">Prayer not found</div>;

  return (
    <>
      {/* Standardized Header */}
      <div className="flex items-center justify-center mb-3 relative">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setLanguage(language === 'hebrew' ? 'english' : 'hebrew')}
            variant="ghost"
            size="sm"
            className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
              language === 'hebrew' 
                ? 'bg-blush text-white' 
                : 'text-black/60 hover:text-black hover:bg-white/50'
            }`}
          >
            {language === 'hebrew' ? 'עב' : 'EN'}
          </Button>
          
          <DialogTitle className="text-lg font-serif font-bold text-black">{prayer.prayerName}</DialogTitle>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs text-black/60 font-medium">{fontSize}px</span>
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
      <div className="bg-white rounded-2xl p-6 mb-3 shadow-sm border border-warm-gray/10 max-h-[65vh] overflow-y-auto">
        <div
          className={`${language === 'hebrew' ? 'secular-one-bold text-right' : 'font-english'} leading-relaxed text-black`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {language === 'hebrew' ? prayer.hebrewText : prayer.englishTranslation}
        </div>
        {prayer.transliteration && language === 'english' && (
          <div
            className="text-black/60 italic mt-4"
            style={{ fontSize: `${fontSize - 2}px` }}
          >
            {prayer.transliteration}
          </div>
        )}
      </div>

      <Button 
        onClick={() => closeModal()} 
        className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0"
      >
        Close
      </Button>

      {/* Special Thanks Section */}
      <div className="text-xs text-gray-500 mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <p className="mb-2 font-medium text-gray-700">
          Special thanks to Chuppah.org
        </p>
        <p className="mb-2">
          For providing these beautiful prayers and spiritual resources
        </p>
        <a 
          href="https://www.chuppah.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          Visit Chuppah.org
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
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
    openModal('individual-tehillim');
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
        <DialogTitle className="text-lg font-serif font-semibold text-black">Special Tehillim</DialogTitle>
        <DialogDescription className="text-xs text-black/70">
          Specific psalms for different needs and occasions
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[60vh] overflow-y-auto space-y-3">
        {categories.map((category, index) => (
          <div key={index} className="bg-white/80 rounded-2xl p-3 border border-blush/10">
            <h3 className="font-serif text-sm text-black font-bold mb-2">{category.title}</h3>
            <div className="flex flex-wrap gap-2">
              {category.psalms.map((psalm) => (
                <button
                  key={psalm}
                  onClick={() => openTehillimText(psalm)}
                  className="bg-gradient-feminine text-white px-3 py-1 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {psalm}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button 
        onClick={() => closeModal()} 
        className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0 mt-4"
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
      <div className="flex items-center justify-center mb-3 relative">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setLanguage(language === 'hebrew' ? 'english' : 'hebrew')}
            variant="ghost"
            size="sm"
            className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
              language === 'hebrew' 
                ? 'bg-blush text-white' 
                : 'text-black/60 hover:text-black hover:bg-white/50'
            }`}
          >
            {language === 'hebrew' ? 'עב' : 'EN'}
          </Button>
          
          <DialogTitle className="text-lg font-serif font-bold text-black">Tehillim {selectedPsalm}</DialogTitle>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs text-black/60 font-medium">{fontSize}px</span>
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
      <div className="bg-white rounded-2xl p-6 mb-3 shadow-sm border border-warm-gray/10 max-h-[65vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div
            className={`${language === 'hebrew' ? 'secular-one-bold text-right' : 'font-english text-left'} leading-relaxed text-black`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {tehillimText?.text || `Psalm ${selectedPsalm} text loading...`}
          </div>
        )}
      </div>

      <Button 
        onClick={() => {
          // Complete the tefilla task and trigger heart explosion
          completeTask('tefilla');
          setShowHeartExplosion(true);
          
          // Check for daily completion and redirect to home after a short delay
          setTimeout(() => {
            checkAndShowCongratulations();
            closeModal();
            // Navigate to home page to see the heart explosion
            window.location.hash = '#/';
          }, 2000);
        }} 
        className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0"
      >
        Complete
      </Button>
      
      {/* Heart Explosion Animation */}
      <HeartExplosion 
        trigger={showHeartExplosion}
        onComplete={() => setShowHeartExplosion(false)} 
      />
    </>
  );
}
