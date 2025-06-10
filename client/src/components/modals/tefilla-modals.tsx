import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { HandHeart, Scroll, Heart, Languages, Type, Plus, Minus, CheckCircle, Calendar, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { MinchaPrayer } from "@shared/schema";

export default function TefillaModals() {
  const { activeModal, openModal, closeModal } = useModalStore();
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [fontSize, setFontSize] = useState(16);

  // Nishmas 40-Day Campaign state
  const [nishmasDay, setNishmasDay] = useState(0);
  const [nishmasStartDate, setNishmasStartDate] = useState<string | null>(null);
  const [nishmasLanguage, setNishmasLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [todayCompleted, setTodayCompleted] = useState(false);

  const { data: minchaPrayers = [], isLoading } = useQuery<MinchaPrayer[]>({
    queryKey: ['/api/mincha/prayers'],
    enabled: activeModal === 'mincha'
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
      {/* Tehillim Modal */}
      <Dialog open={activeModal === 'tehillim'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Tehillim Cycle</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            Today's Tehillim chapters (140-150) with translations and commentary...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Mincha Modal */}
      <Dialog open={activeModal === 'mincha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Mincha Prayer</DialogTitle>
          </DialogHeader>
          
          {/* Language and Font Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'hebrew' ? 'english' : 'hebrew')}
                className="text-xs px-2 py-1 h-auto border-gray-300 bg-white hover:bg-gray-50"
              >
                {language === 'hebrew' ? 'EN' : 'עב'}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-blush-pink" />
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className="p-1 hover:bg-white rounded-md transition-colors"
              >
                <Minus className="h-3 w-3 text-blush-pink" />
              </button>
              <span className="text-xs text-gray-600 min-w-[2rem] text-center">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                className="p-1 hover:bg-white rounded-md transition-colors"
              >
                <Plus className="h-3 w-3 text-blush-pink" />
              </button>
            </div>
          </div>

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
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Women's Prayers Modal */}
      <Dialog open={activeModal === 'womens-prayers'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Women's Prayers</DialogTitle>
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
                <span className="font-medium">Blessings</span>
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
                <span className="font-medium">Tefillos</span>
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
                <span className="font-medium">Personal Prayers</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Blessings Modal */}
      <Dialog open={activeModal === 'blessings'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Blessings</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            Daily blessings and their proper recitation...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Tefillos Modal */}
      <Dialog open={activeModal === 'tefillos'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Tefillos</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            Traditional prayers and their meanings...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Personal Prayers Modal */}
      <Dialog open={activeModal === 'personal-prayers'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Personal Prayers</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            Guidance for personal prayer and connection...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Nishmas 40-Day Campaign Modal */}
      <Dialog open={activeModal === 'nishmas-campaign'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <Heart className="text-blush mr-2" size={24} />
              <DialogTitle className="text-lg font-semibold">Nishmas 40-Day Campaign</DialogTitle>
            </div>
            <p className="text-sm text-gray-600">
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
              <div className={`text-sm leading-relaxed ${
                nishmasLanguage === 'hebrew' ? 'text-right font-hebrew' : 'font-english'
              }`}>
                {nishmasLanguage === 'hebrew' ? (
                  <p className="mb-4">
                    נִשְׁמַת כָּל חַי תְּבָרֵךְ אֶת שִׁמְךָ יְיָ אֱלֹהֵינוּ, וְרוּחַ כָּל בָּשָׂר תְּפָאֵר וּתְרוֹמֵם זִכְרְךָ מַלְכֵּנוּ תָּמִיד...
                  </p>
                ) : (
                  <p className="mb-4">
                    The soul of every living being shall bless Your Name, Hashem, our G-d, and the spirit of all flesh shall always glorify and exalt Your remembrance, our King...
                  </p>
                )}
                <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="mb-2">
                    {nishmasLanguage === 'hebrew' 
                      ? 'לטקסט המלא, בקרו באתר Nishmas.net'
                      : 'For the complete prayer text, visit Nishmas.net'
                    }
                  </p>
                  <p>
                    {nishmasLanguage === 'hebrew'
                      ? '/* מקום לטקסט התפילה המלא - להוספה עתידית */'
                      : '/* Future integration: Complete prayer text from authorized source */'
                    }
                  </p>
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
                className="w-full py-3 rounded-xl font-medium text-white cursor-default"
                style={{ backgroundColor: 'hsl(120, 25%, 65%)' }}
                disabled={true}
              >
                <CheckCircle className="mr-2" size={16} />
                Today's Prayer Completed
              </Button>
            ) : (
              <Button 
                onClick={markNishmasCompleted}
                className="w-full py-3 rounded-xl font-medium gradient-blush-peach text-white hover:opacity-90"
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
    </>
  );
}
