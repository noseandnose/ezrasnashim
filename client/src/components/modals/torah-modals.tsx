import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";

interface TorahModalsProps {
  onSectionChange?: (section: any) => void;
}

// Standardized Modal Header Component
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

export default function TorahModals({ onSectionChange }: TorahModalsProps) {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete } = useModalCompletionStore();
  const [, setLocation] = useLocation();
  const [showExplosion, setShowExplosion] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showHebrew, setShowHebrew] = useState(true);
  const [showFootnotes, setShowFootnotes] = useState(false);
  const { trackModalComplete } = useTrackModalComplete();

  // Reset explosion state when modal changes
  useEffect(() => {
    setShowExplosion(false);
  }, [activeModal]);

  const handleTorahComplete = () => {
    // Track modal completion and mark as completed globally
    if (activeModal) {
      trackModalComplete(activeModal);
      markModalComplete(activeModal);
    }
    
    setShowExplosion(true);
    
    // Wait for animation to complete before proceeding
    setTimeout(() => {
      setShowExplosion(false); // Reset explosion state
      completeTask('torah');
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
          openModal('congratulations');
        }
      }, 200);
    }, 500);
  };

  const today = new Date().toISOString().split('T')[0];

  const { data: halachaContent } = useQuery<{title?: string; content?: string; footnotes?: string}>({
    queryKey: ['/api/torah/halacha', today],
    enabled: activeModal === 'halacha',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });

  const { data: emunaContent } = useQuery<{title?: string; content?: string; audioUrl?: string; source?: string; duration?: string; author?: string; speaker?: string; provider?: string; speakerWebsite?: string}>({
    queryKey: ['/api/torah/emuna', today],
    enabled: activeModal === 'emuna',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: chizukContent } = useQuery<{title?: string; content?: string; audioUrl?: string; source?: string; duration?: string; speaker?: string; provider?: string; speakerWebsite?: string}>({
    queryKey: ['/api/torah/chizuk', today],
    enabled: activeModal === 'chizuk',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: featuredContent } = useQuery<{title?: string; content?: string; halachicSource?: string; practicalTip?: string; provider?: string; speakerWebsite?: string}>({
    queryKey: ['/api/torah/featured', today],
    enabled: activeModal === 'featured',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: pirkeiAvotContent } = useQuery<Record<string, any>>({
    queryKey: ['/api/torah/pirkei-avot', today],
    enabled: activeModal === 'pirkei-avot',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  return (
    <>
      {/* Halacha Modal */}
      <Dialog open={activeModal === 'halacha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="halacha-description">
          <div id="halacha-description" className="sr-only">Daily Jewish law and practice content</div>
          
          <StandardModalHeader 
            title="Daily Halacha"
            showHebrew={showHebrew}
            setShowHebrew={setShowHebrew}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          
          <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[60vh] overflow-y-auto">
            {halachaContent && (
              <div className="space-y-4">
                {/* Title */}
                {halachaContent.title && (
                  <h3 className="platypi-bold text-lg text-black text-center mb-4">
                    {halachaContent.title}
                  </h3>
                )}
                
                {/* Main Content */}
                <div 
                  className="platypi-regular leading-relaxed text-black whitespace-pre-line"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {halachaContent.content}
                </div>
              </div>
            )}
          </div>
          
          {/* Expandable Footnotes Section */}
          {halachaContent?.footnotes && (
            <div className="mb-1">
              <button
                onClick={() => setShowFootnotes(!showFootnotes)}
                className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-2xl p-3 border border-gray-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="platypi-medium text-black text-sm">Footnotes</span>
                  <span className="platypi-regular text-black/60 text-lg">
                    {showFootnotes ? '−' : '+'}
                  </span>
                </div>
              </button>
              
              {showFootnotes && (
                <div className="bg-white rounded-2xl p-4 mt-2 border border-gray-200">
                  <div 
                    className="platypi-regular leading-relaxed text-black/80 text-sm whitespace-pre-line"
                  >
                    {halachaContent.footnotes}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Thank You Section */}
          <div className="mt-1 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-black platypi-medium">
              Provided by Rabbi Daniel Braude from{' '}
              <a 
                href="https://www.feldheim.com/learn-shabbos-in-just-3-minutes-a-day"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Learn Shabbos in just 3 minutes a day
              </a>
            </p>
          </div>
          
          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium mt-4 border-0"
            >
              Completed
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Emuna Modal */}
      <Dialog open={activeModal === 'emuna'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto font-sans" aria-describedby="emuna-description">
          <div id="emuna-description" className="sr-only">Daily faith strengthening and spiritual trust content</div>
          
          {/* Simple Header for Audio Content */}
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Daily Emuna</DialogTitle>
          </div>
          
          <div className="bg-white rounded-2xl p-6 mb-3 shadow-sm border border-warm-gray/10 max-h-[50vh] overflow-y-auto">
            {emunaContent && emunaContent.audioUrl && (
              <div className="space-y-4">
                {emunaContent.speaker && (
                  <p className="text-sm text-black/60 text-center">
                    <strong>Speaker:</strong> {emunaContent.speaker}
                  </p>
                )}
                <AudioPlayer 
                  title={emunaContent.title || 'Emuna'}
                  duration={emunaContent.duration || "0:00"}
                  audioUrl={emunaContent.audioUrl}
                />
              </div>
            )}
            
            {emunaContent && !emunaContent.audioUrl && (
              <div className="space-y-4" style={{ fontSize: `${fontSize}px` }}>
                <div className="secular-one-bold text-right leading-relaxed text-black">
                  {emunaContent.content}
                </div>
                {(emunaContent.author || emunaContent.source) && (
                  <div className="text-xs text-black/60 text-center border-t border-warm-gray/10 pt-3 space-y-1">
                    {emunaContent.author && <p>Author: {emunaContent.author}</p>}
                    {emunaContent.source && <p>Source: {emunaContent.source}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Thank You Section */}
          {emunaContent?.provider && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🙏 Thank you to {emunaContent.provider}
              </p>
              {emunaContent.speakerWebsite && (
                <p className="text-sm text-blue-800">
                  <a 
                    href={emunaContent.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Completed
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Chizuk Modal */}
      <Dialog open={activeModal === 'chizuk'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto font-sans" aria-describedby="chizuk-description">
          <div id="chizuk-description" className="sr-only">5-minute daily inspiration and spiritual strengthening content</div>
          
          {/* Simple Header for Audio Content */}
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Daily Chizuk</DialogTitle>
          </div>
          
          <div className="bg-white rounded-2xl p-6 mb-3 shadow-sm border border-warm-gray/10 max-h-[50vh] overflow-y-auto">
            {chizukContent && chizukContent.audioUrl && (
              <div className="space-y-4">
                {chizukContent.speaker && (
                  <p className="text-sm text-black/60 text-center">
                    <strong>Speaker:</strong> {chizukContent.speaker}
                  </p>
                )}
                <AudioPlayer 
                  title={chizukContent.title || 'Chizuk'}
                  duration={chizukContent.duration || "0:00"}
                  audioUrl={chizukContent.audioUrl}
                />
              </div>
            )}
          </div>
          
          {/* Thank You Section */}
          {chizukContent?.provider && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🙏 Thank you to {chizukContent.provider}
              </p>
              {chizukContent.speakerWebsite && (
                <p className="text-sm text-blue-800">
                  <a 
                    href={chizukContent.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Completed
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Featured Modal */}
      <Dialog open={activeModal === 'featured'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[95vh] overflow-y-auto" aria-describedby="featured-description">
          <DialogHeader className="text-center mb-4 pr-8">
            <DialogTitle className="text-lg font-serif font-bold text-black">Featured Content</DialogTitle>
            {featuredContent && (
              <DialogDescription className="text-sm text-gray-600 font-sans">{featuredContent.title}</DialogDescription>
            )}
          </DialogHeader>
          <div id="featured-description" className="sr-only">Featured special topics and content</div>
          
          {featuredContent && (
            <div className="space-y-3 text-sm text-gray-700 font-sans">
              <div>
                <p><strong>Today's Focus:</strong> {featuredContent.content}</p>
                {featuredContent.halachicSource && (
                  <p className="mt-2 text-xs text-gray-500">Source: {featuredContent.halachicSource}</p>
                )}
                {featuredContent.practicalTip && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700">Practical Insight:</p>
                    <p className="text-xs text-gray-600 mt-1">{featuredContent.practicalTip}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Thank You Section */}
          {featuredContent?.provider && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🙏 Thank you to {featuredContent.provider}
              </p>
              {featuredContent.speakerWebsite && (
                <p className="text-sm text-blue-800">
                  <a 
                    href={featuredContent.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Completed
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Pirkei Avot Modal */}
      <Dialog open={activeModal === 'pirkei-avot'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[95vh] overflow-y-auto" aria-describedby="pirkei-avot-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Pirkei Avot</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">Ethics of the Fathers</DialogDescription>
          </DialogHeader>
          <div id="pirkei-avot-description" className="sr-only">Ethics of the Fathers - timeless wisdom from Jewish sages</div>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p><strong>Today's Teaching:</strong> {pirkeiAvotContent?.content || "Shimon his son says: All my days I have grown up among the wise, and I have found nothing better for the body than silence."}</p>
              <p className="mt-2 text-xs text-gray-500">- {pirkeiAvotContent?.source || "Pirkei Avot 1:17"}</p>
              <p className="mt-3">{pirkeiAvotContent?.explanation || "This mishnah teaches us the value of thoughtful speech and careful listening. True wisdom often comes through quiet contemplation and attentive observation of those wiser than ourselves."}</p>
            </div>
          </div>
          
          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Completed
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}