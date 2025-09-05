import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { formatThankYouMessageFull } from "@/lib/link-formatter";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { Expand, BookOpen } from "lucide-react";

export default function ParshaVortModal() {
  const { activeModal, closeModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState<any>({ isOpen: false });

  const isOpen = activeModal === 'parsha-vort';

  // Fetch parsha vort content - exactly as it was working before
  const { data: parshaVorts, isLoading } = useQuery<any[]>({
    queryKey: ['/api/table/vort'],
    enabled: isOpen, // Only fetch when modal is open
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
  });

  const parshaVort = parshaVorts?.[0]; // Get first vort from array

  const isCompleted = isModalComplete('parsha-vort');

  const handleComplete = () => {
    trackModalComplete('parsha-vort');
    markModalComplete('parsha-vort');
    completeTask('torah');
    setShowHeartExplosion(true);
    setTimeout(() => {
      setShowHeartExplosion(false);
      checkAndShowCongratulations();
      closeModal();
    }, 1000);
  };

  const openFullscreen = () => {
    if (!parshaVort) return;
    
    setFullscreenContent({
      isOpen: true,
      title: parshaVort.title || 'Weekly Parsha Vort',
      content: (
        <div className="space-y-4">
          {/* Main Content */}
          <div className="bg-white rounded-2xl p-6 border border-blush/10">
            <div className="koren-siddur-english text-base leading-relaxed text-black">
              {parshaVort.content}
            </div>
          </div>

          {/* Speaker Info */}
          {parshaVort.speaker && (
            <div className="bg-blue-50 rounded-2xl px-4 py-3 border border-blue-200">
              <span className="text-sm platypi-medium text-black">
                Speaker: {parshaVort.speaker}
                {parshaVort.speakerWebsite && (
                  <a 
                    href={parshaVort.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blush underline hover:text-blush/80"
                  >
                    Visit Website
                  </a>
                )}
              </span>
            </div>
          )}

          {/* Dynamic Thank You Message with Clickable Links */}
          {parshaVort.thankYouMessage && (
            <div className="bg-gradient-to-r from-blush/10 to-lavender/10 rounded-2xl p-4 border border-blush/20">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blush" />
                <span className="text-sm platypi-bold text-black">Special Thanks</span>
              </div>
              <div 
                className="text-sm platypi-regular text-black leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatThankYouMessageFull(parshaVort.thankYouMessage)
                }}
              />
            </div>
          )}

          {/* Audio Player */}
          {parshaVort.audioUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <AudioPlayer 
                audioUrl={parshaVort.audioUrl} 
                title={parshaVort.title || 'Weekly Parsha Vort'}
                duration="0:00"
              />
            </div>
          )}

          {/* Complete Button */}
          <Button
            onClick={isCompleted ? undefined : handleComplete}
            disabled={isCompleted}
            className={`w-full py-3 rounded-xl platypi-medium border-0 ${
              isCompleted 
                ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
            }`}
          >
            {isCompleted ? 'Completed Today' : 'Complete Parsha Vort'}
          </Button>
        </div>
      )
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <FullscreenModal 
        {...fullscreenContent} 
        onClose={() => setFullscreenContent({ isOpen: false })} 
      />

      <Dialog open={isOpen} onOpenChange={closeModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto bg-gradient-to-br from-blush to-lavender border-0 shadow-2xl">
          <div className="relative">
            {/* Fullscreen button */}
            <button
              onClick={openFullscreen}
              className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
              aria-label="Open fullscreen"
            >
              <Expand className="h-4 w-4 text-gray-600" />
            </button>

            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-lg platypi-bold text-black">
                {parshaVort?.title || 'Weekly Parsha Vort'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Speaker Info - Always show if exists */}
              {parshaVort?.speaker && (
                <div className="text-center">
                  <span className="text-sm platypi-medium text-black/70">
                    By {parshaVort.speaker}
                  </span>
                </div>
              )}

              {/* Content Preview - only show if content exists */}
              {parshaVort?.content && (
                <div className="bg-white/80 rounded-2xl p-4">
                  <div className="koren-siddur-english text-sm leading-relaxed text-black line-clamp-4">
                    {parshaVort.content}
                  </div>
                </div>
              )}

              {/* Audio Player - Always show if exists */}
              {parshaVort?.audioUrl && (
                <AudioPlayer 
                  audioUrl={parshaVort.audioUrl} 
                  title={parshaVort.title || 'Weekly Parsha Vort'}
                  duration="0:00"
                />
              )}

              {/* Thank You Message - Always show if exists */}
              {parshaVort?.thankYouMessage && (
                <div className="bg-white/60 rounded-xl p-3 text-center">
                  <div 
                    className="text-xs platypi-regular text-black/80 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: formatThankYouMessageFull(parshaVort.thankYouMessage)
                    }}
                  />
                </div>
              )}

              {/* Complete Button - Always show */}
              <Button
                onClick={isCompleted ? undefined : handleComplete}
                disabled={isCompleted}
                className={`w-full py-3 rounded-xl platypi-medium border-0 ${
                  isCompleted 
                    ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                    : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
                }`}
              >
                {isCompleted ? 'Completed Today' : 'Complete Parsha Vort'}
              </Button>

              {!parshaVort && (
                <div className="text-center py-8">
                  <p className="text-sm text-black/60">Loading parsha vort...</p>
                </div>
              )}
            </div>

            {/* Heart Explosion Animation */}
            <HeartExplosion 
              trigger={showHeartExplosion}
              onComplete={() => setShowHeartExplosion(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}