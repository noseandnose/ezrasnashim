import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { formatTextContent, formatHalachaContent, formatContentWithFootnotes } from "@/lib/text-formatter";
import { formatThankYouMessage } from "@/lib/link-formatter";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { AttributionSection } from "@/components/ui/attribution-section";
import { Expand } from "lucide-react";


interface TorahModalsProps {
  onSectionChange?: (section: any) => void;
}


export default function TorahModals({ onSectionChange }: TorahModalsProps) {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const [showExplosion, setShowExplosion] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showFootnotes, setShowFootnotes] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    contentType?: string;
  }>({ isOpen: false, title: '', content: null });
  const { trackModalComplete } = useTrackModalComplete();

  // Reset explosion state when modal changes
  useEffect(() => {
    setShowExplosion(false);
  }, [activeModal]);

  // Auto-redirect Torah modals to fullscreen - RE-ENABLED for halacha and featured
  // These now open modal briefly and auto-redirect to fullscreen immediately
  useEffect(() => {
    // Re-enable halacha and featured to auto-redirect to fullscreen
    const fullscreenTorahModals = ['halacha', 'featured'];
    
    if (activeModal && fullscreenTorahModals.includes(activeModal)) {
      let title = '';
      let contentType = '';
      
      switch (activeModal) {
        case 'halacha':
          title = 'Learn Shabbos';
          contentType = 'halacha';
          break;
        case 'featured':
          title = 'Shmirat Halashon';
          contentType = 'featured';
          break;
      }
      
      // Immediate redirect to fullscreen (no delay)
      setFullscreenContent({
        isOpen: true,
        title,
        contentType,
        content: null // Content will be rendered by fullscreen modal
      });
      
      // Close the modal immediately to prevent any flash
      closeModal();
    }
  }, [activeModal, setFullscreenContent, closeModal]);

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
      
      // Check if all tasks are completed and show congratulations
      if (checkAndShowCongratulations()) {
        openModal('congratulations', 'torah');
      } else {
        // Only close and navigate if congratulations wasn't shown
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
      }
    }, 500);
  };

  const today = new Date().toISOString().split('T')[0];

  const { data: halachaContent } = useQuery<{title?: string; content?: string; footnotes?: string; attributionLabel?: string; attributionLogoUrl?: string; attributionAboutText?: string}>({
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

  const { data: featuredContent } = useQuery<{title?: string; content?: string; provider?: string; footnotes?: string; attributionLabel?: string; attributionLogoUrl?: string; attributionAboutText?: string}>({
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

  const { data: parshaVortContent } = useQuery<{title?: string; content?: string; audioUrl?: string; speaker?: string; speakerWebsite?: string; thankYouMessage?: string}>({
    queryKey: ['/api/table/vort'],
    enabled: activeModal === 'parsha-vort',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });



  return (
    <>
      {/* Halacha Modal */}
      <Dialog open={activeModal === 'halacha'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="halacha-description">
          <div id="halacha-description" className="sr-only">Daily Jewish law and practice content</div>
          
          {/* Fullscreen button in top left */}
          <button
            onClick={() => {
              if (halachaContent) {
                setFullscreenContent({
                  isOpen: true,
                  title: 'Daily Halacha',
                  contentType: 'halacha',
                  content: (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl p-6 border border-blush/10">
                        {halachaContent.title && (
                          <h3 className="platypi-bold text-lg text-black text-center mb-4">
                            {halachaContent.title}
                          </h3>
                        )}
                        <div 
                          className="platypi-regular leading-relaxed text-black whitespace-pre-line"
                          style={{ fontSize: `${fontSize}px` }}
                          dangerouslySetInnerHTML={{ __html: formatHalachaContent(halachaContent.content, halachaContent.footnotes) }}
                        />
                        {halachaContent.footnotes && (
                          <div className="border-t pt-4 mt-6">
                            <h4 className="platypi-medium text-black text-base mb-2">Footnotes</h4>
                            <div className="platypi-regular leading-relaxed text-black/80 text-sm whitespace-pre-line">
                              {halachaContent.footnotes}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                        <p className="text-sm text-black platypi-medium">
                          Provided by Rabbi Daniel Braude from{' '}
                          <a 
                            href="https://www.feldheim.com/learn-shabbos-in-just-3-minutes-a-day"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Feldheim Publishers
                          </a>
                        </p>
                      </div>
                      
                      <div className="heart-explosion-container">
                        <Button 
                          onClick={isModalComplete('halacha') ? undefined : () => {
                            trackModalComplete('halacha');
                            markModalComplete('halacha');
                            setShowExplosion(true);
                            setTimeout(() => {
                              setShowExplosion(false);
                              completeTask('torah');
                              
                              // Check if all tasks are completed and show congratulations
                              if (checkAndShowCongratulations()) {
                                openModal('congratulations', 'torah');
                              }
                              
                              // Close fullscreen and navigate home
                              const event = new CustomEvent('closeFullscreen');
                              window.dispatchEvent(event);
                              // Small delay to ensure fullscreen closes, then navigate to home
                              setTimeout(() => {
                                window.location.hash = '#/?section=home&scrollToProgress=true';
                              }, 100);
                            }, 1500);
                          }}
                          disabled={isModalComplete('halacha')}
                          className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                            isModalComplete('halacha') 
                              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                          }`}
                        >
                          {isModalComplete('halacha') ? 'Completed Today' : 'Complete'}
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
          
          <div className="mb-1">
            {/* Custom header with reading time for Halacha */}
            <div className="flex items-center justify-center mb-1 relative pr-8">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <DialogTitle className="text-lg platypi-bold text-black">Daily Halacha</DialogTitle>
                </div>
                
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
          </div>
          
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
                    <div dangerouslySetInnerHTML={{ __html: formatHalachaContent(halachaContent.content, halachaContent.footnotes) }} />
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
              onClick={isModalComplete('halacha') ? undefined : handleTorahComplete}
              disabled={isModalComplete('halacha')}
              className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                isModalComplete('halacha') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('halacha') ? 'Completed Today' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Emuna Modal - DISABLED: Now handled in daily-emuna-modal.tsx as fullscreen */}
      <Dialog open={false} onOpenChange={() => closeModal(true)}>
        <DialogContent aria-describedby="emuna-description">
          <div id="emuna-description" className="sr-only">Daily faith strengthening and spiritual trust content</div>
          
          {/* Fullscreen button */}
          {emunaContent && !emunaContent.audioUrl && (
            <button
              onClick={() => {
                setFullscreenContent({
                  isOpen: true,
                  title: 'Daily Emuna',
                  content: (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl p-6 border border-blush/10">
                        {emunaContent.title && (
                          <h3 className="platypi-bold text-lg text-black text-center mb-4">
                            {emunaContent.title}
                          </h3>
                        )}
                        <div 
                          className="secular-one-bold text-right leading-relaxed text-black"
                          style={{ fontSize: `${fontSize + 2}px` }}
                        >
                          <div dangerouslySetInnerHTML={{ __html: formatTextContent(emunaContent.content) }} />
                        </div>
                      </div>
                      
                      <div className="heart-explosion-container">
                        <Button 
                          onClick={isModalComplete('emuna') ? undefined : () => {
                            trackModalComplete('emuna');
                            markModalComplete('emuna');
                            setShowExplosion(true);
                            setTimeout(() => {
                              setShowExplosion(false);
                              completeTask('torah');
                              
                              // Check if all tasks are completed and show congratulations
                              if (checkAndShowCongratulations()) {
                                openModal('congratulations', 'torah');
                              }
                              
                              // Close fullscreen and navigate home
                              const event = new CustomEvent('closeFullscreen');
                              window.dispatchEvent(event);
                              // Small delay to ensure fullscreen closes, then navigate to home
                              setTimeout(() => {
                                window.location.hash = '#/?section=home&scrollToProgress=true';
                              }, 100);
                            }, 1500);
                          }}
                          disabled={isModalComplete('emuna')}
                          className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                            isModalComplete('emuna') 
                              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                          }`}
                        >
                          {isModalComplete('emuna') ? 'Completed Today' : 'Complete'}
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
          
          {/* Simple Header for Audio Content */}
          <div className="flex items-center justify-center mb-1 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Daily Emuna</DialogTitle>
          </div>
          
          <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[60vh] overflow-y-auto">
            {emunaContent && emunaContent.audioUrl && (
              <div className="space-y-4">
                {/* Title */}
                {emunaContent.title && (
                  <h3 className="platypi-bold text-lg text-black text-center mb-4">
                    {emunaContent.title}
                  </h3>
                )}
                
                <AudioPlayer 
                  title={emunaContent.title || 'Emuna'}
                  duration={emunaContent.duration || "0:00"}
                  audioUrl={emunaContent.audioUrl}
                  onAudioEnded={() => {
                    // Auto-complete when audio finishes, but only if not already completed
                    if (!isModalComplete('emuna')) {
                      handleTorahComplete();
                    }
                  }}
                />
              </div>
            )}
            
            {emunaContent && !emunaContent.audioUrl && (
              <div className="space-y-4" style={{ fontSize: `${fontSize}px` }}>
                <div 
                  className="secular-one-bold text-right leading-relaxed text-black"
                  dangerouslySetInnerHTML={{ __html: formatTextContent(emunaContent.content) }}
                />
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
          <div className="mt-1 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-black platypi-medium">
              Thank you to{' '}
              <a 
                href="https://transformyouremunah.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Rav Reuven Garber
              </a>
              {' '}and{' '}
              <a 
                href="https://transformyouremunah.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                TransformYourEmuna
              </a>
              {' '}for this content
            </p>
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('emuna') ? undefined : handleTorahComplete}
              disabled={isModalComplete('emuna')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('emuna') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('emuna') ? 'Completed Today' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Chizuk Modal - DISABLED: Now handled in daily-chizuk-modal.tsx as fullscreen */}
      <Dialog open={false} onOpenChange={() => closeModal(true)}>
        <DialogContent aria-describedby="chizuk-description">
          <div id="chizuk-description" className="sr-only">5-minute daily inspiration and spiritual strengthening content</div>
          
          {/* Simple Header for Audio Content */}
          <div className="flex items-center justify-center mb-1 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Daily Chizuk</DialogTitle>
          </div>
          
          <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[60vh] overflow-y-auto">
            {chizukContent && chizukContent.audioUrl && (
              <div className="space-y-4">
                {/* Title */}
                {chizukContent.title && (
                  <h3 className="platypi-bold text-lg text-black text-center mb-4">
                    {chizukContent.title}
                  </h3>
                )}
                
                <AudioPlayer 
                  title={chizukContent.title || 'Chizuk'}
                  duration={chizukContent.duration || "0:00"}
                  audioUrl={chizukContent.audioUrl}
                  onAudioEnded={() => {
                    // Auto-complete when audio finishes, but only if not already completed
                    if (!isModalComplete('chizuk')) {
                      handleTorahComplete();
                    }
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Thank You Section */}
          <div className="mt-1 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-black platypi-medium">
              Thank you to{' '}
              <a 
                href="https://outorah.org/author/133215/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Rabbi David Ashear
              </a>
              {' '}for providing this content
            </p>
          </div>

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('chizuk') ? undefined : handleTorahComplete}
              disabled={isModalComplete('chizuk')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('chizuk') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('chizuk') ? 'Completed Today' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Parsha Vort Modal - DISABLED: Now handled in table-modals.tsx to prevent modal layering */}
      <Dialog open={false} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="parsha-vort-description">
          <div id="parsha-vort-description" className="sr-only">Weekly Torah portion insights and commentary</div>
          
          {/* Simple Header for Audio Content */}
          <div className="flex items-center justify-center mb-1 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Parsha Shiur</DialogTitle>
          </div>
          
          <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[60vh] overflow-y-auto">
            {parshaVortContent && parshaVortContent.audioUrl && (
              <div className="space-y-4">
                {/* Title */}
                {parshaVortContent.title && (
                  <h3 className="platypi-bold text-lg text-black text-center mb-4">
                    {parshaVortContent.title}
                  </h3>
                )}
                
                <AudioPlayer 
                  title={parshaVortContent.title || 'Parsha Shiur'}
                  duration="0:00"
                  audioUrl={parshaVortContent.audioUrl}
                />
              </div>
            )}
          </div>
          
          {/* Thank You Section - Dynamic from database */}
          {parshaVortContent?.thankYouMessage && (
            parshaVortContent.speakerWebsite ? (
              <div className="mt-1 p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                <a
                  href={parshaVortContent.speakerWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blush platypi-medium hover:text-blush/80 transition-colors underline"
                  data-testid="link-parsha-thank-you"
                  dangerouslySetInnerHTML={{
                    __html: formatThankYouMessage(parshaVortContent.thankYouMessage)
                  }}
                />
              </div>
            ) : (
              <div className="mt-1 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div 
                  className="text-sm text-black platypi-medium"
                  dangerouslySetInnerHTML={{ __html: formatThankYouMessage(parshaVortContent.thankYouMessage) }}
                />
              </div>
            )
          )}

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('parsha-vort') ? undefined : handleTorahComplete}
              disabled={isModalComplete('parsha-vort')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('parsha-vort') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('parsha-vort') ? 'Completed Today' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Featured Modal */}
      <Dialog open={activeModal === 'featured'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="featured-description">
          <div id="featured-description" className="sr-only">Featured special topics and content</div>
          
          {/* Fullscreen button */}
          <button
            onClick={() => {
              if (featuredContent) {
                setFullscreenContent({
                  isOpen: true,
                  title: 'Featured Content',
                  content: (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl p-6 border border-blush/10">
                        {featuredContent.title && (
                          <h3 className="platypi-bold text-lg text-black text-center mb-4">
                            {featuredContent.title}
                          </h3>
                        )}
                        <div 
                          className="platypi-regular leading-relaxed text-black whitespace-pre-line"
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          <div dangerouslySetInnerHTML={{ __html: formatContentWithFootnotes(featuredContent.content, featuredContent.footnotes) }} />
                        </div>
                      </div>
                      
                      {/* Thank You Section for Featured Content */}
                      {featuredContent.provider && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-sm text-blue-900 platypi-medium">
                            Thank you to{' '}
                            {featuredContent.provider === 'Rabbi Daniel Braude' ? (
                              <>
                                Rabbi Daniel Braude from{' '}
                                <a 
                                  href="https://feldheim.com/learn-hilchos-lashon-hara-in-just-3-minutes-a-day"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                >
                                  Learn Hilchos Lashon Hara in just 3 minutes a day
                                </a>
                              </>
                            ) : (
                              featuredContent.provider
                            )}
                          </p>
                        </div>
                      )}
                      
                      <div className="heart-explosion-container">
                        <Button 
                          onClick={isModalComplete('featured') ? undefined : () => {
                            trackModalComplete('featured');
                            markModalComplete('featured');
                            setShowExplosion(true);
                            setTimeout(() => {
                              setShowExplosion(false);
                              completeTask('torah');
                              
                              // Check if all tasks are completed and show congratulations
                              if (checkAndShowCongratulations()) {
                                openModal('congratulations', 'torah');
                              }
                              
                              // Close fullscreen and navigate home
                              const event = new CustomEvent('closeFullscreen');
                              window.dispatchEvent(event);
                              // Small delay to ensure fullscreen closes, then navigate to home
                              setTimeout(() => {
                                window.location.hash = '#/?section=home&scrollToProgress=true';
                              }, 100);
                            }, 1500);
                          }}
                          disabled={isModalComplete('featured')}
                          className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                            isModalComplete('featured') 
                              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                          }`}
                        >
                          {isModalComplete('featured') ? 'Completed Today' : 'Complete'}
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
          
          <div className="mb-1">
            {/* Custom header with font size controls - matches Halacha modal */}
            <div className="mb-2 space-y-2">
              {/* First Row: Title */}
              <div className="flex items-center justify-center">
                <DialogTitle className="text-lg platypi-bold text-black">Featured Content</DialogTitle>
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
          </div>
          
          <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[60vh] overflow-y-auto">
            {featuredContent && (
              <div className="space-y-4">
                {/* Title */}
                {featuredContent.title && (
                  <h3 className="platypi-bold text-lg text-black text-center mb-4">
                    {featuredContent.title}
                  </h3>
                )}
                
                {/* Main Content */}
                <div 
                  className="platypi-regular leading-relaxed text-black whitespace-pre-line"
                  style={{ fontSize: `${fontSize}px` }}
                >
                    <div dangerouslySetInnerHTML={{ __html: formatContentWithFootnotes(featuredContent.content, featuredContent.footnotes) }} />
                </div>
              </div>
            )}
          </div>

          {/* Footnotes Section - matches Halacha modal */}
          {featuredContent?.footnotes && (
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
                    {featuredContent.footnotes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thank You Section - matches Halacha modal style */}
          {featuredContent?.provider && (
            <div className="mb-1 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-900 platypi-medium">
                Thank you to{' '}
                {featuredContent.provider === 'Rabbi Daniel Braude' ? (
                  <>
                    Rabbi Daniel Braude from{' '}
                    <a 
                      href="https://feldheim.com/learn-hilchos-lashon-hara-in-just-3-minutes-a-day"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Learn Hilchos Lashon Hara in just 3 minutes a day
                    </a>
                  </>
                ) : (
                  featuredContent.provider
                )}
              </p>
            </div>
          )}

          <div className="heart-explosion-container">
            <Button 
              onClick={isModalComplete('featured') ? undefined : handleTorahComplete}
              disabled={isModalComplete('featured')}
              className={`w-full py-3 rounded-xl platypi-medium mt-6 border-0 ${
                isModalComplete('featured') 
                  ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                  : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
              }`}
            >
              {isModalComplete('featured') ? 'Completed Today' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Pirkei Avot Modal */}
      <Dialog open={activeModal === 'pirkei-avot'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="max-h-[95vh] overflow-y-auto" aria-describedby="pirkei-avot-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg platypi-semibold mb-2">Pirkei Avot</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">Ethics of the Fathers</DialogDescription>
          </DialogHeader>
          <div id="pirkei-avot-description" className="sr-only">Ethics of the Fathers - timeless wisdom from Jewish sages</div>
          
          <div className="space-y-3 text-base">
            <div>
              <p className="font-bold text-black">
                <strong>Today's Teaching:</strong>{' '}
                <span className="font-bold" dangerouslySetInnerHTML={{ __html: formatTextContent(pirkeiAvotContent?.content || "Shimon his son says: All my days I have grown up among the wise, and I have found nothing better for the body than silence.") }} />
              </p>
              <p className="mt-2 text-sm font-semibold text-black/70">
                - <span dangerouslySetInnerHTML={{ __html: formatTextContent(pirkeiAvotContent?.source || "Pirkei Avot 1:17") }} />
              </p>
              <p 
                className="mt-3 font-bold text-black leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatTextContent(pirkeiAvotContent?.explanation || "This mishnah teaches us the value of thoughtful speech and careful listening. True wisdom often comes through quiet contemplation and attentive observation of those wiser than ourselves.") }}
              />
            </div>
          </div>
          
          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium mt-6 border-0"
            >
              Completed
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Modal */}
      <FullscreenModal
        isOpen={fullscreenContent.isOpen}
        onClose={() => setFullscreenContent({ isOpen: false, title: '', content: null })}
        title={fullscreenContent.title}
        showFontControls={true}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        showLanguageControls={false}
      >
        {fullscreenContent.contentType === 'halacha' ? (
          halachaContent && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-blush/10">
                {halachaContent.title && (
                  <h3 className="platypi-bold text-lg text-black text-center mb-4">
                    {halachaContent.title}
                  </h3>
                )}
                <div 
                  className="platypi-regular leading-relaxed text-black whitespace-pre-line"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatHalachaContent(halachaContent.content, halachaContent.footnotes) }} />
                </div>

                {/* Footnotes Section */}
                {halachaContent.footnotes && showFootnotes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="platypi-bold text-sm text-black mb-3">Footnotes</h4>
                    <div 
                      className="platypi-regular text-sm text-black/80 leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: formatTextContent(halachaContent.footnotes) }}
                    />
                  </div>
                )}

                {/* Footnotes Toggle */}
                {halachaContent.footnotes && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setShowFootnotes(!showFootnotes)}
                      className="text-xs platypi-medium text-black/60 hover:text-black transition-colors underline"
                    >
                      {showFootnotes ? 'Hide Footnotes' : 'Show Footnotes'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Attribution Section for Halacha */}
              <AttributionSection
                label={halachaContent.attributionLabel || "Thank you to Rabbi Daniel Braude for this content"}
                logoUrl={halachaContent.attributionLogoUrl}
                aboutText={halachaContent.attributionAboutText}
                websiteUrl="https://feldheim.com/learn-shabbos-in-just-3-minutes-a-day"
                websiteLabel="Learn Shabbos in just 3 minutes a day"
              />
              
              <div className="heart-explosion-container">
                <Button 
                  onClick={isModalComplete('halacha') ? undefined : () => {
                    trackModalComplete('halacha');
                    markModalComplete('halacha');
                    setShowExplosion(true);
                    setTimeout(() => {
                      setShowExplosion(false);
                      completeTask('torah');
                      
                      // Check if all tasks are completed and show congratulations
                      if (checkAndShowCongratulations()) {
                        openModal('congratulations', 'torah');
                      }
                      
                      // Close fullscreen and navigate home
                      const event = new CustomEvent('closeFullscreen');
                      window.dispatchEvent(event);
                      // Small delay to ensure fullscreen closes, then navigate to home
                      setTimeout(() => {
                        window.location.hash = '#/?section=home&scrollToProgress=true';
                      }, 100);
                    }, 1500);
                  }}
                  disabled={isModalComplete('halacha')}
                  className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                    isModalComplete('halacha') 
                      ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                      : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                  }`}
                >
                  {isModalComplete('halacha') ? 'Completed Today' : 'Complete'}
                </Button>
                <HeartExplosion trigger={showExplosion} />
              </div>
            </div>
          )
        ) : fullscreenContent.contentType === 'featured' ? (
          featuredContent && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-blush/10">
                {featuredContent.title && (
                  <h3 className="platypi-bold text-lg text-black text-center mb-4">
                    {featuredContent.title}
                  </h3>
                )}
                <div 
                  className="platypi-regular leading-relaxed text-black whitespace-pre-line"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatContentWithFootnotes(featuredContent.content, featuredContent.footnotes) }} />
                </div>

                {/* Footnotes Section */}
                {featuredContent.footnotes && showFootnotes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="platypi-bold text-sm text-black mb-3">Footnotes</h4>
                    <div 
                      className="platypi-regular text-sm text-black/80 leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: formatTextContent(featuredContent.footnotes) }}
                    />
                  </div>
                )}

                {/* Footnotes Toggle */}
                {featuredContent.footnotes && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setShowFootnotes(!showFootnotes)}
                      className="text-xs platypi-medium text-black/60 hover:text-black transition-colors underline"
                    >
                      {showFootnotes ? 'Hide Footnotes' : 'Show Footnotes'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Attribution Section for Featured Content */}
              <AttributionSection
                label={featuredContent.attributionLabel || `Thank you to ${featuredContent.provider || 'Rabbi Daniel Braude'} for this content`}
                logoUrl={featuredContent.attributionLogoUrl}
                aboutText={featuredContent.attributionAboutText}
                websiteUrl={featuredContent.provider === 'Rabbi Daniel Braude' ? "https://feldheim.com/learn-hilchos-lashon-hara-in-just-3-minutes-a-day" : undefined}
                websiteLabel="Learn Hilchos Lashon Hara in just 3 minutes a day"
              />
              
              <div className="heart-explosion-container">
                <Button 
                  onClick={isModalComplete('featured') ? undefined : () => {
                    trackModalComplete('featured');
                    markModalComplete('featured');
                    setShowExplosion(true);
                    setTimeout(() => {
                      setShowExplosion(false);
                      completeTask('torah');
                      
                      // Check if all tasks are completed and show congratulations
                      if (checkAndShowCongratulations()) {
                        openModal('congratulations', 'torah');
                      }
                      
                      // Close fullscreen and navigate home
                      const event = new CustomEvent('closeFullscreen');
                      window.dispatchEvent(event);
                      // Small delay to ensure fullscreen closes, then navigate to home
                      setTimeout(() => {
                        window.location.hash = '#/?section=home&scrollToProgress=true';
                      }, 100);
                    }, 1500);
                  }}
                  disabled={isModalComplete('featured')}
                  className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                    isModalComplete('featured') 
                      ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                      : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                  }`}
                >
                  {isModalComplete('featured') ? 'Completed Today' : 'Complete'}
                </Button>
                <HeartExplosion trigger={showExplosion} />
              </div>
            </div>
          )
        ) : (
          fullscreenContent.content
        )}
      </FullscreenModal>
      
    </>
  );
}