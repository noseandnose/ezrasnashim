import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { formatThankYouMessageFull } from "@/lib/link-formatter";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { BookOpen } from "lucide-react";
import { getHebrewFontClass } from "@/lib/hebrewUtils";

export default function ParshaVortModal() {
  const { activeModal, closeModal, openModal, selectedParshaVortId } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);

  const isOpen = activeModal === 'parsha-vort';
  const isCompleted = isModalComplete('parsha-vort');

  const { data: parshaVort, isLoading } = useQuery<any>({
    queryKey: ['/api/table/vort'],
    enabled: isOpen,
    staleTime: 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
    select: (data) => {
      if (!data || !Array.isArray(data)) return null;
      // If a specific parsha vort ID is selected, find that one
      if (selectedParshaVortId) {
        return data.find((vort: any) => vort.id === selectedParshaVortId) || data[0];
      }
      // Otherwise return the first one
      return data[0];
    }
  });

  const handleComplete = () => {
    trackModalComplete('parsha-vort');
    markModalComplete('parsha-vort');
    completeTask('torah');
    setShowHeartExplosion(true);
    setTimeout(() => {
      setShowHeartExplosion(false);
      
      // Check if all tasks are completed and show congratulations
      if (checkAndShowCongratulations()) {
        openModal('congratulations', 'torah');
      } else {
        closeModal();
      }
    }, 1000);
  };

  const titleText = parshaVort?.hebrew_parsha || parshaVort?.title || 'Weekly Parsha Vort';
  
  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={closeModal}
      title={titleText}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading parsha vort...</p>
        </div>
      ) : parshaVort ? (
        <div className="space-y-4">
          {/* Speaker Info */}
          {parshaVort.speaker && (
            <div className="bg-blush/10 rounded-2xl px-4 py-3 border border-blush/20">
              <span className="text-sm platypi-medium text-black">
                By {parshaVort.speaker}
                {parshaVort.speakerWebsite && (
                  <a 
                    href={parshaVort.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blush underline hover:text-blush/80"
                    data-testid="link-speaker-website"
                  >
                    Visit Website
                  </a>
                )}
              </span>
            </div>
          )}

          {/* Main Content */}
          {parshaVort.content && (
            <div className="bg-white rounded-2xl p-6 border border-blush/10">
              <div className={`${getHebrewFontClass(parshaVort.content, 'koren-siddur-english')} text-base leading-relaxed text-black`}>
                {parshaVort.content}
              </div>
            </div>
          )}

          {/* Video Player */}
          {parshaVort.videoUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <video 
                controls 
                className="w-full rounded-lg"
                src={parshaVort.videoUrl}
              >
                Your browser does not support the video tag.
              </video>
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

          {/* Thank You Message */}
          {parshaVort.thankYouMessage && (
            <div className="bg-gradient-to-r from-blush/10 to-lavender/10 rounded-2xl p-4 border border-blush/20">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blush" />
                <span className="text-sm platypi-bold text-black">Special Thanks</span>
              </div>
              {parshaVort.speakerWebsite ? (
                <a
                  href={parshaVort.speakerWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm platypi-regular text-blush leading-relaxed hover:text-blush/80 transition-colors underline block"
                  data-testid="link-parsha-thank-you"
                  dangerouslySetInnerHTML={{
                    __html: formatThankYouMessageFull(parshaVort.thankYouMessage)
                  }}
                />
              ) : (
                <div 
                  className="text-sm platypi-regular text-black leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatThankYouMessageFull(parshaVort.thankYouMessage)
                  }}
                />
              )}
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
            data-testid={isCompleted ? 'button-parsha-completed' : 'button-complete-parsha'}
          >
            {isCompleted ? 'Completed Today' : 'Complete Parsha Vort'}
          </Button>

          {/* Heart Explosion Animation */}
          <HeartExplosion 
            trigger={showHeartExplosion}
            onComplete={() => setShowHeartExplosion(false)} 
          />
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-black/60">No parsha vort available for this week</p>
        </div>
      )}
    </FullscreenModal>
  );
}