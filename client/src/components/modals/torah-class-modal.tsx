import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { AttributionSection } from "@/components/ui/attribution-section";
import { getHebrewFontClass, getTextDirection } from "@/lib/hebrewUtils";
import { formatThankYouMessageFull } from "@/lib/link-formatter";
import type { TorahClass } from "@shared/schema";

export default function TorahClassModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);

  const isOpen = activeModal === 'torah-class';
  const isCompleted = isModalComplete('torah-class');

  const { data: torahClass, isLoading } = useQuery<TorahClass>({
    queryKey: ['/api/torah-classes'],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data: any) => {
      if (!data || !Array.isArray(data)) return null;
      return data[0];
    }
  });

  const handleComplete = () => {
    trackModalComplete('torah-class');
    markModalComplete('torah-class');
    completeTask('torah');
    setShowHeartExplosion(true);
    setTimeout(() => {
      setShowHeartExplosion(false);
      
      if (checkAndShowCongratulations()) {
        openModal('congratulations', 'torah');
      } else {
        closeModal();
      }
    }, 1000);
  };

  const titleText = torahClass?.title || 'Torah Class';
  
  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={closeModal}
      title={titleText}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading Torah class...</p>
        </div>
      ) : torahClass ? (
        <div className="space-y-4">
          {torahClass.speaker && (
            <div className="bg-blush/10 rounded-2xl px-4 py-3 border border-blush/20">
              <span className="text-sm platypi-medium text-black">
                By {torahClass.speaker}
                {torahClass.speakerWebsite && (
                  <a 
                    href={torahClass.speakerWebsite} 
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

          {torahClass.content && (
            <div className="bg-white rounded-2xl p-6 border border-blush/10">
              <div 
                className={`${getHebrewFontClass(torahClass.content, 'koren-siddur-english')} text-base leading-relaxed text-black`}
                dir={getTextDirection(torahClass.content)}
                style={{ textAlign: getTextDirection(torahClass.content) === 'rtl' ? 'right' : 'left' }}
              >
                {torahClass.content}
              </div>
            </div>
          )}

          {torahClass.imageUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <img 
                src={torahClass.imageUrl} 
                alt="Source material"
                className="w-full rounded-lg"
                loading="lazy"
              />
            </div>
          )}

          {torahClass.videoUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={torahClass.videoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {torahClass.audioUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <AudioPlayer 
                audioUrl={torahClass.audioUrl} 
                title={torahClass.title || 'Torah Class'}
                duration="0:00"
                onAudioEnded={() => {
                  if (!isCompleted) {
                    handleComplete();
                  }
                }}
              />
            </div>
          )}

          <AttributionSection
            label={torahClass.thankYouMessage 
              ? formatThankYouMessageFull(torahClass.thankYouMessage)
              : `Thank you to ${torahClass.speaker || 'the speaker'} for this content`}
            labelHtml={!!torahClass.thankYouMessage}
            logoUrl={torahClass.attributionLogoUrl}
            aboutText={torahClass.attributionAboutText || `${torahClass.speaker || 'This speaker'} shares inspiring Torah insights to help you grow spiritually.`}
            websiteUrl={torahClass.speakerWebsite}
            websiteLabel="Visit Website"
          />

          <Button
            onPointerDown={isCompleted ? undefined : handleComplete}
            disabled={isCompleted}
            className={`w-full py-3 rounded-xl platypi-medium border-0 ${
              isCompleted 
                ? 'bg-sage text-white' 
                : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
            }`}
            data-testid={isCompleted ? 'button-torah-class-completed' : 'button-complete-torah-class'}
          >
            {isCompleted ? 'Completed Today' : 'Complete'}
          </Button>

          <HeartExplosion 
            trigger={showHeartExplosion}
            onComplete={() => setShowHeartExplosion(false)} 
          />
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-black/60">No Torah class available today</p>
        </div>
      )}
    </FullscreenModal>
  );
}
