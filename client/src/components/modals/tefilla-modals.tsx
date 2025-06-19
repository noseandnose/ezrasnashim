import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { HandHeart, Scroll, Heart, Languages, Type, Plus, Minus, CheckCircle, Calendar, RotateCcw, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { MinchaPrayer, NishmasText, GlobalTehillimProgress, TehillimName, WomensPrayer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function TefillaModals() {
  const { activeModal, openModal, closeModal } = useModalStore();
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [fontSize, setFontSize] = useState(16);
  const [showHebrew, setShowHebrew] = useState(true);
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const queryClient = useQueryClient();

  const handlePrayerSelect = (prayerId: number) => {
    setSelectedPrayerId(prayerId);
    closeModal();
    openModal('individual-prayer');
  };

  // Nishmas 40-Day Campaign state
  const [nishmasDay, setNishmasDay] = useState(0);
  const [nishmasStartDate, setNishmasStartDate] = useState<string | null>(null);
  const [nishmasLanguage, setNishmasLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [nishmasFontSize, setNishmasFontSize] = useState(16);

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

  // Mutation to complete a perek
  const completePerekMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/tehillim/complete', { completedBy: 'user' });
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

  const getTehillimText = (perekNumber: number, isHebrew: boolean) => {
    const tehillimTexts: Record<number, { hebrew: string; english: string }> = {
      1: {
        hebrew: "אַשְׁרֵי הָאִישׁ אֲשֶׁר לֹא הָלַךְ בַּעֲצַת רְשָׁעִים וּבְדֶרֶךְ חַטָּאִים לֹא עָמָד וּבְמוֹשַׁב לֵצִים לֹא יָשָׁב׃ כִּי אִם בְּתוֹרַת יְהוָה חֶפְצוֹ וּבְתוֹרָתוֹ יֶהְגֶּה יוֹמָם וָלָיְלָה׃",
        english: "Happy is the man who has not walked in the counsel of the wicked, nor stood in the way of sinners, nor sat in the seat of scorners. But his delight is in the law of the Lord, and in His law he meditates day and night."
      },
      2: {
        hebrew: "לָמָּה רָגְשׁוּ גוֹיִם וּלְאֻמִּים יֶהְגּוּ רִיק׃ יִתְיַצְּבוּ מַלְכֵי אֶרֶץ וְרוֹזְנִים נוֹסְדוּ יָחַד עַל יְהוָה וְעַל מְשִׁיחוֹ׃",
        english: "Why do the nations rage, and the peoples plot in vain? The kings of the earth set themselves, and the rulers take counsel together, against the Lord and against His anointed."
      },
      3: {
        hebrew: "מִזְמוֹר לְדָוִד בְּבָרְחוֹ מִפְּנֵי אַבְשָׁלוֹם בְּנוֹ׃ יְהוָה מָה רַבּוּ צָרָי רַבִּים קָמִים עָלָי׃",
        english: "A Psalm of David, when he fled from Absalom his son. Lord, how many are my foes! Many are rising against me."
      },
      11: {
        hebrew: "בַּיהוָה חָסִיתִי אֵיךְ תֹּאמְרוּ לְנַפְשִׁי נוּדִי הַרְכֶם צִפּוֹר׃",
        english: "In the Lord I take refuge; how can you say to my soul, 'Flee like a bird to your mountain'?"
      },
      12: {
        hebrew: "הוֹשִׁיעָה יְהוָה כִּי גָמַר חָסִיד כִּי פָסוּ אֱמוּנִים מִבְּנֵי אָדָם׃",
        english: "Save, O Lord, for the godly one is gone; for the faithful have vanished from among the children of man."
      }
    };

    const text = tehillimTexts[perekNumber];
    if (!text) {
      return (
        <div className="text-sm text-gray-600 italic text-center">
          {isHebrew ? `פרק ${perekNumber} - טקסט מלא זמין בספר תהלים` : `Perek ${perekNumber} - Full text available in Tehillim book`}
        </div>
      );
    }

    return (
      <div className={`text-sm leading-relaxed ${isHebrew ? 'text-right font-hebrew' : 'font-english'}`}>
        {isHebrew ? text.hebrew : text.english}
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
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto font-sans">
          <DialogHeader className="text-center mb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHebrew(!showHebrew)}
                className="text-xs px-2 py-1 h-auto border-gray-300 bg-white hover:bg-gray-50"
              >
                {showHebrew ? 'EN' : 'עב'}
              </Button>
              <DialogTitle className="text-lg font-serif font-semibold">Tehillim {progress?.currentPerek || 1}</DialogTitle>
              <div className="flex items-center gap-0 mr-8">
                <Type className="h-4 w-4 text-blush-pink mr-2" />
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="p-1 hover:bg-white rounded-md transition-colors"
                >
                  <Minus className="h-3 w-3 text-blush-pink" />
                </button>
                <span className="text-xs text-gray-600 min-w-[2rem] text-center px-1">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="p-1 hover:bg-white rounded-md transition-colors"
                >
                  <Plus className="h-3 w-3 text-blush-pink" />
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Tehillim Text */}
          <div className="mb-6 bg-white/70 rounded-2xl p-4 border border-blush/10">
            <div
              className={`${showHebrew ? 'font-hebrew text-right' : 'font-english'} leading-relaxed`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {getTehillimText(progress?.currentPerek || 1, showHebrew)}
            </div>
          </div>

          <Button 
            onClick={() => {
              completePerek();
              closeModal();
            }}
            disabled={completePerekMutation.isPending}
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0"
          >
            {completePerekMutation.isPending ? 'Completing...' : 'Complete'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Mincha Modal */}
      <Dialog open={activeModal === 'mincha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto font-sans">
          <DialogHeader className="text-center mb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'hebrew' ? 'english' : 'hebrew')}
                className="text-xs px-2 py-1 h-auto border-gray-300 bg-white hover:bg-gray-50"
              >
                {language === 'hebrew' ? 'EN' : 'עב'}
              </Button>
              <DialogTitle className="text-lg font-serif font-semibold">Mincha Prayer</DialogTitle>
              <div className="flex items-center gap-0 mr-8">
                <Type className="h-4 w-4 text-blush-pink mr-2" />
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="p-1 hover:bg-white rounded-md transition-colors"
                >
                  <Minus className="h-3 w-3 text-blush-pink" />
                </button>
                <span className="text-xs text-gray-600 min-w-[2rem] text-center px-1">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="p-1 hover:bg-white rounded-md transition-colors"
                >
                  <Plus className="h-3 w-3 text-blush-pink" />
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Prayer Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center text-gray-500">Loading prayers...</div>
            ) : (
              minchaPrayers.map((prayer) => (
                <div key={prayer.id} className="p-4 bg-white rounded-xl border border-cream-light">
                  <div className="text-center">
                    <div
                      className={`${language === 'hebrew' ? 'font-hebrew text-right' : 'font-english'} leading-relaxed`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {language === 'hebrew' ? prayer.hebrewText : prayer.englishTranslation}
                    </div>
                    {prayer.transliteration && language === 'english' && (
                      <div
                        className="text-gray-500 italic mt-2"
                        style={{ fontSize: `${fontSize - 2}px` }}
                      >
                        {prayer.transliteration}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Women's Prayers Modal */}
      <Dialog open={activeModal === 'womens-prayers'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 font-sans" aria-describedby="womens-prayers-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold">Women's Prayers</DialogTitle>
            <p id="womens-prayers-description" className="text-xs text-warm-gray/70 mt-1">
              Special prayers and blessings for women
            </p>
          </DialogHeader>
          
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

          <Button 
            onClick={() => closeModal()} 
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Blessings Modal */}
      <Dialog open={activeModal === 'blessings'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 font-sans" aria-describedby="blessings-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold">Blessings</DialogTitle>
            <p id="blessings-description" className="text-xs text-warm-gray/70 mt-1">
              Daily blessings and their proper recitation
            </p>
          </DialogHeader>
          
          <div className="text-center text-gray-600 font-sans">
            Daily blessings and their proper recitation...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Tefillos Modal */}
      <Dialog open={activeModal === 'tefillos'} onOpenChange={() => closeModal()}>
        <DialogContent aria-describedby="tefillos-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold">Tefillos</DialogTitle>
            <p id="tefillos-description" className="text-xs text-warm-gray/70 mt-1">
              Traditional prayers and their meanings
            </p>
          </DialogHeader>
          
          <div className="text-center text-gray-600 font-sans">
            Traditional prayers and their meanings...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Complete
          </Button>
        </DialogContent>
      </Dialog>

      {/* Personal Prayers Modal */}
      <Dialog open={activeModal === 'personal-prayers'} onOpenChange={() => closeModal()}>
        <DialogContent aria-describedby="personal-prayers-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold">Personal Prayers</DialogTitle>
            <p id="personal-prayers-description" className="text-xs text-warm-gray/70 mt-1">
              Guidance for personal prayer and connection
            </p>
          </DialogHeader>
          
          <div className="text-center text-gray-600 font-sans">
            Guidance for personal prayer and connection...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Complete
          </Button>
        </DialogContent>
      </Dialog>

      {/* Nishmas 40-Day Campaign Modal */}
      <Dialog open={activeModal === 'nishmas-campaign'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto font-sans" aria-describedby="nishmas-description">
          <DialogHeader className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <Heart className="text-blush mr-2" size={24} />
              <DialogTitle className="text-lg font-serif font-semibold">Nishmas 40-Day Campaign</DialogTitle>
            </div>
            <p id="nishmas-description" className="text-sm text-gray-600 font-sans">
              May this 40-day tefillah bring you the yeshuos you need
            </p>
          </DialogHeader>
          
          {/* Progress Tracker */}
          <div className="mb-3">
            <div className="bg-gradient-to-r from-blush/10 to-peach/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800">Progress</span>
                <span className="text-2xl font-bold text-blush">{nishmasDay}/40</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(nishmasDay / 40) * 100}%`,
                    background: 'linear-gradient(90deg, hsl(328, 85%, 87%) 0%, hsl(28, 100%, 84%) 100%)'
                  }}
                ></div>
              </div>
              
              {/* Debug info for progress bar */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 text-center mb-2">
                  Progress: Day {nishmasDay}/40 ({Math.round((nishmasDay / 40) * 100)}%)
                </div>
              )}
              
              {nishmasDay === 0 ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Begin your 40-day journey today</p>
                  <p className="text-xs text-gray-500">Complete daily prayers for spiritual merit</p>
                </div>
              ) : nishmasDay === 40 ? (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="text-sage mr-2" size={20} />
                    <span className="font-semibold text-sage">Campaign Completed!</span>
                  </div>
                  <p className="text-xs text-gray-600">May your tefillos be answered</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Day {nishmasDay} completed</p>
                  <p className="text-xs text-gray-500">{40 - nishmasDay} days remaining</p>
                </div>
              )}
            </div>
          </div>

          {/* Prayer Text */}
          <div className="mb-6">
            <div className="bg-warm-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNishmasFontSize(Math.max(12, nishmasFontSize - 2))}
                    className="text-xs px-2 py-1 h-auto border-gray-300 bg-white hover:bg-gray-50"
                    disabled={nishmasFontSize <= 12}
                  >
                    <Minus size={10} />
                  </Button>
                  <span className="text-xs text-gray-600 px-1">{nishmasFontSize}px</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNishmasFontSize(Math.min(24, nishmasFontSize + 2))}
                    className="text-xs px-2 py-1 h-auto border-gray-300 bg-white hover:bg-gray-50"
                    disabled={nishmasFontSize >= 24}
                  >
                    <Plus size={10} />
                  </Button>
                </div>
                <h3 className="font-semibold text-center flex-1">
                  {nishmasLanguage === 'hebrew' ? 'נשמת כל חי' : 'Nishmas Kol Chai'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNishmasLanguage(nishmasLanguage === 'hebrew' ? 'english' : 'hebrew')}
                  className="text-xs px-2 py-1 h-auto border-gray-300 bg-white hover:bg-gray-50"
                >
                  {nishmasLanguage === 'hebrew' ? 'EN' : 'עב'}
                </Button>
              </div>
              <div className={`leading-relaxed ${
                nishmasLanguage === 'hebrew' ? 'text-right font-hebrew' : 'font-english'
              }`} style={{ fontSize: `${nishmasFontSize}px` }}>
                {nishmasLoading ? (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Loading prayer text...</p>
                  </div>
                ) : nishmasText ? (
                  <div className="mb-4">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {(nishmasText as any)?.fullText || nishmasText.fullText || 'Text not available'}
                    </p>
                    {(nishmasText as any)?.transliteration && nishmasLanguage === 'hebrew' && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 italic">
                          {(nishmasText as any).transliteration}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-red-600 text-sm">Failed to load prayer text</p>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <p className="mb-2 font-medium text-gray-700">
                    {nishmasLanguage === 'hebrew' 
                      ? 'תודה מיוחדת ל-Nishmas.net'
                      : 'Special thanks to Nishmas.net'
                    }
                  </p>
                  <p className="mb-2">
                    {nishmasLanguage === 'hebrew' 
                      ? 'לטקסט התפילה המלא והמקורות האותנטיים'
                      : 'For providing the complete prayer text and authentic sources'
                    }
                  </p>
                  <a 
                    href="https://nishmas.net" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {nishmasLanguage === 'hebrew' 
                      ? 'בקרו באתר Nishmas.net'
                      : 'Visit Nishmas.net'
                    }
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Main Action Button - Always Visible */}
            {nishmasDay >= 40 ? (
              <Button 
                className="w-full py-3 rounded-xl font-medium bg-sage text-white cursor-default"
                disabled={true}
              >
                <CheckCircle className="mr-2" size={16} />
                Campaign Complete
              </Button>
            ) : todayCompleted ? (
              <Button 
                className="w-full py-3 rounded-xl font-medium bg-sage text-white cursor-default"
                disabled={true}
              >
                <CheckCircle className="mr-2" size={16} />
                Today's Prayer Completed
              </Button>
            ) : (
              <Button 
                onClick={markNishmasCompleted}
                className="w-full py-3 rounded-xl font-medium bg-gradient-feminine text-white hover:opacity-90"
              >
                <CheckCircle className="mr-2" size={16} />
                Mark Today's Prayer Complete
              </Button>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => closeModal()} 
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              
              {nishmasDay > 0 && (
                <Button 
                  onClick={resetNishmasCampaign}
                  variant="outline"
                  className="px-4 text-gray-600 hover:text-gray-800"
                >
                  <RotateCcw size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p className="mb-1">
              {nishmasLanguage === 'hebrew'
                ? 'אם תפספסי יום אחד, המחזור יתחיל מחדש'
                : 'Missing a day will restart your 40-day cycle'
              }
            </p>
            <p>
              {nishmasLanguage === 'hebrew'
                ? '/* מקום להוספת התראות והזכרות עתידיות */'
                : '/* Future feature: Notification and reminder system */'
              }
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refuah Prayers Modal */}
      <Dialog open={activeModal === 'refuah'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 font-sans">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold">Refuah Prayers</DialogTitle>
          </DialogHeader>
          <RefuahPrayersList onPrayerSelect={handlePrayerSelect} />
        </DialogContent>
      </Dialog>

      {/* Family Prayers Modal */}
      <Dialog open={activeModal === 'family'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 font-sans">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold">Family Prayers</DialogTitle>
          </DialogHeader>
          <FamilyPrayersList onPrayerSelect={handlePrayerSelect} />
        </DialogContent>
      </Dialog>

      {/* Life Prayers Modal */}
      <Dialog open={activeModal === 'life'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 font-sans">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold">Life Prayers</DialogTitle>
          </DialogHeader>
          <LifePrayersList onPrayerSelect={handlePrayerSelect} />
        </DialogContent>
      </Dialog>

      {/* Individual Prayer Modal */}
      <Dialog open={activeModal === 'individual-prayer'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto font-sans">
          <IndividualPrayerContent prayerId={selectedPrayerId} language={language} fontSize={fontSize} setLanguage={setLanguage} setFontSize={setFontSize} />
        </DialogContent>
      </Dialog>
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
      {/* Prayer Header with Controls */}
      <DialogHeader className="text-center mb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'hebrew' ? 'english' : 'hebrew')}
            className="text-xs px-2 py-1 h-auto border-gray-300 bg-white hover:bg-gray-50"
          >
            {language === 'hebrew' ? 'EN' : 'עב'}
          </Button>
          <DialogTitle className="text-lg font-serif font-semibold">{prayer.prayerName}</DialogTitle>
          <div className="flex items-center gap-0 mr-8">
            <Type className="h-4 w-4 text-blush-pink mr-2" />
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="p-1 hover:bg-white rounded-md transition-colors"
            >
              <Minus className="h-3 w-3 text-blush-pink" />
            </button>
            <span className="text-xs text-gray-600 min-w-[2rem] text-center px-1">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              className="p-1 hover:bg-white rounded-md transition-colors"
            >
              <Plus className="h-3 w-3 text-blush-pink" />
            </button>
          </div>
        </div>
      </DialogHeader>

      {/* Prayer Content */}
      <div className="p-4 bg-white rounded-xl border border-cream-light mb-6">
        <div className="text-center">
          <div
            className={`${language === 'hebrew' ? 'font-hebrew text-right' : 'font-english'} leading-relaxed`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {language === 'hebrew' ? prayer.hebrewText : prayer.englishTranslation}
          </div>
          {prayer.transliteration && language === 'english' && (
            <div
              className="text-gray-500 italic mt-4"
              style={{ fontSize: `${fontSize - 2}px` }}
            >
              {prayer.transliteration}
            </div>
          )}
        </div>
      </div>

      <Button 
        onClick={() => closeModal()} 
        className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0"
      >
        Close
      </Button>
    </>
  );
}
