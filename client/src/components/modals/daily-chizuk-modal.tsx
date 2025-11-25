import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { AttributionSection } from "@/components/ui/attribution-section";

export default function DailyChizukModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);

  const isOpen = activeModal === 'chizuk';
  const isCompleted = isModalComplete('chizuk');

  const today = new Date().toISOString().split('T')[0];

  const { data: chizukContent, isLoading } = useQuery<{
    title?: string;
    content?: string;
    audioUrl?: string;
    duration?: string;
    speaker?: string;
    speakerWebsite?: string;
    attributionLabel?: string;
    attributionLogoUrl?: string;
    attributionAboutText?: string;
  }>({
    queryKey: ['/api/torah/chizuk', today],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const handleComplete = () => {
    trackModalComplete('chizuk');
    markModalComplete('chizuk');
    completeTask('torah');
    setShowHeartExplosion(true);
    setTimeout(() => {
      setShowHeartExplosion(false);
      
      if (checkAndShowCongratulations()) {
        openModal('congratulations', 'torah');
      } else {
        closeModal();
        window.location.hash = '#/?section=home&scrollToProgress=true';
      }
    }, 1000);
  };

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={closeModal}
      title="Daily Chizuk"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading daily chizuk...</p>
        </div>
      ) : chizukContent ? (
        <div className="space-y-4">
          {chizukContent.title && (
            <div className="bg-blush/10 rounded-2xl px-4 py-3 border border-blush/20">
              <h3 className="text-base platypi-bold text-black text-center">
                {chizukContent.title}
              </h3>
            </div>
          )}

          {chizukContent.speaker && (
            <div className="text-center">
              <span className="text-sm platypi-medium text-black/70">
                By {chizukContent.speaker}
                {chizukContent.speakerWebsite && (
                  <a 
                    href={chizukContent.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blush underline hover:text-blush/80"
                    data-testid="link-chizuk-speaker-website"
                  >
                    Visit Website
                  </a>
                )}
              </span>
            </div>
          )}

          {chizukContent.audioUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <AudioPlayer 
                audioUrl={chizukContent.audioUrl} 
                title={chizukContent.title || 'Daily Chizuk'}
                duration={chizukContent.duration || "0:00"}
                onAudioEnded={() => {
                  if (!isCompleted) {
                    handleComplete();
                  }
                }}
              />
            </div>
          )}

          {chizukContent.content && (
            <div className="bg-white rounded-2xl p-6 border border-blush/10">
              <div className="platypi-regular text-base leading-relaxed text-black">
                {chizukContent.content}
              </div>
            </div>
          )}

          <AttributionSection
            label={chizukContent.attributionLabel || `Thank you to ${chizukContent.speaker || 'Rabbi David Ashear'} for this content`}
            logoUrl={chizukContent.attributionLogoUrl}
            aboutText={chizukContent.attributionAboutText}
            websiteUrl={chizukContent.speakerWebsite}
            websiteLabel="Visit Website"
          />

          <Button
            onClick={isCompleted ? undefined : handleComplete}
            disabled={isCompleted}
            className={`w-full py-3 rounded-xl platypi-medium border-0 ${
              isCompleted 
                ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
            }`}
            data-testid={isCompleted ? 'button-chizuk-completed' : 'button-complete-chizuk'}
          >
            {isCompleted ? 'Completed Today' : 'Complete Daily Chizuk'}
          </Button>

          <HeartExplosion 
            trigger={showHeartExplosion}
            onComplete={() => setShowHeartExplosion(false)} 
          />
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-black/60">No daily chizuk available for today</p>
        </div>
      )}
    </FullscreenModal>
  );
}
