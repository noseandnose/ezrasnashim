import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { AttributionSection } from "@/components/ui/attribution-section";

export default function DailyEmunaModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);

  const isOpen = activeModal === 'emuna';
  const isCompleted = isModalComplete('emuna');

  const today = new Date().toISOString().split('T')[0];

  const { data: emunaContent, isLoading } = useQuery<{
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
    queryKey: ['/api/torah/emuna', today],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const handleComplete = () => {
    trackModalComplete('emuna');
    markModalComplete('emuna');
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
      title="Daily Emuna"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading daily emuna...</p>
        </div>
      ) : emunaContent ? (
        <div className="space-y-4">
          {emunaContent.title && (
            <div className="bg-blush/10 rounded-2xl px-4 py-3 border border-blush/20">
              <h3 className="text-base platypi-bold text-black text-center">
                {emunaContent.title}
              </h3>
            </div>
          )}

          {emunaContent.speaker && (
            <div className="text-center">
              <span className="text-sm platypi-medium text-black/70">
                By {emunaContent.speaker}
                {emunaContent.speakerWebsite && (
                  <a 
                    href={emunaContent.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blush underline hover:text-blush/80"
                    data-testid="link-emuna-speaker-website"
                  >
                    Visit Website
                  </a>
                )}
              </span>
            </div>
          )}

          {emunaContent.audioUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <AudioPlayer 
                audioUrl={emunaContent.audioUrl} 
                title={emunaContent.title || 'Daily Emuna'}
                duration={emunaContent.duration || "0:00"}
                onAudioEnded={() => {
                  if (!isCompleted) {
                    handleComplete();
                  }
                }}
              />
            </div>
          )}

          {emunaContent.content && (
            <div className="bg-white rounded-2xl p-6 border border-blush/10">
              <div className="platypi-regular text-base leading-relaxed text-black">
                {emunaContent.content}
              </div>
            </div>
          )}

          <AttributionSection
            label={emunaContent.attributionLabel || `Thank you to ${emunaContent.speaker || 'Rav Reuven Garber'} and TransformYourEmuna for this content`}
            logoUrl={emunaContent.attributionLogoUrl}
            aboutText={emunaContent.attributionAboutText || "Rav Reuven Garber is a dynamic Torah educator who inspires people to transform their emunah through practical and meaningful teachings."}
            websiteUrl={emunaContent.speakerWebsite || "https://transformyouremunah.com/"}
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
            data-testid={isCompleted ? 'button-emuna-completed' : 'button-complete-emuna'}
          >
            {isCompleted ? 'Completed Today' : 'Complete Daily Emuna'}
          </Button>

          <HeartExplosion 
            trigger={showHeartExplosion}
            onComplete={() => setShowHeartExplosion(false)} 
          />
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-black/60">No daily emuna available for today</p>
        </div>
      )}
    </FullscreenModal>
  );
}
