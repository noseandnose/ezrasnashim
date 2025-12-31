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
import type { LifeClass } from "@shared/schema";

export default function LifeClassModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isOpen = activeModal === 'life-class';
  const isCompleted = isModalComplete('life-class');

  const { data: lifeClass, isLoading } = useQuery<LifeClass>({
    queryKey: ['/api/life-classes'],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data: any) => {
      if (!data || !Array.isArray(data)) return null;
      return data[0];
    }
  });

  const handleComplete = () => {
    if (isCompleting) return; // Prevent double-click
    setIsCompleting(true);
    
    trackModalComplete('life-class');
    markModalComplete('life-class');
    completeTask('life'); // Award Life flower for life lessons
    setShowHeartExplosion(true);
    setTimeout(() => {
      setShowHeartExplosion(false);
      setIsCompleting(false);
      
      if (checkAndShowCongratulations()) {
        openModal('congratulations', 'table');
      } else {
        closeModal();
      }
    }, 1000);
  };

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={closeModal}
      title="Practical Parenting"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading life class...</p>
        </div>
      ) : lifeClass ? (
        <div className="space-y-4">
          {/* Title section */}
          {lifeClass.title && (
            <div className="bg-blush/10 rounded-2xl px-4 py-3 border border-blush/20">
              <h2 className="text-base platypi-bold text-black text-center">{lifeClass.title}</h2>
            </div>
          )}
          
          {lifeClass.content && (
            <div className="bg-white rounded-2xl p-6 border border-blush/10">
              <div 
                className={`${getHebrewFontClass(lifeClass.content, 'koren-siddur-english')} text-base leading-relaxed text-black`}
                dir={getTextDirection(lifeClass.content)}
                style={{ textAlign: getTextDirection(lifeClass.content) === 'rtl' ? 'right' : 'left' }}
              >
                {lifeClass.content}
              </div>
            </div>
          )}

          {lifeClass.imageUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <img 
                src={lifeClass.imageUrl} 
                alt="Source material"
                className="w-full rounded-lg"
                loading="lazy"
              />
            </div>
          )}

          {lifeClass.videoUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={lifeClass.videoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {lifeClass.audioUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <AudioPlayer 
                audioUrl={lifeClass.audioUrl} 
                title={lifeClass.title || 'Life Class'}
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
            label={lifeClass.thankYouMessage 
              ? formatThankYouMessageFull(lifeClass.thankYouMessage)
              : `Thank you to ${lifeClass.speaker || 'the speaker'} for this content`}
            labelHtml={!!lifeClass.thankYouMessage}
            logoUrl={lifeClass.attributionLogoUrl}
            aboutText={lifeClass.attributionAboutText || `${lifeClass.speaker || 'This speaker'} shares inspiring insights to help you grow.`}
            websiteUrl={lifeClass.speakerWebsite}
            websiteLabel="Visit Website"
          />

          <Button
            onClick={isCompleted ? undefined : handleComplete}
            disabled={isCompleted}
            className={`w-full py-3 rounded-xl platypi-medium border-0 ${
              isCompleted 
                ? 'bg-sage text-white' 
                : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
            }`}
            data-testid={isCompleted ? 'button-life-class-completed' : 'button-complete-life-class'}
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
          <p className="text-sm text-black/60">No life class available today</p>
        </div>
      )}
    </FullscreenModal>
  );
}
