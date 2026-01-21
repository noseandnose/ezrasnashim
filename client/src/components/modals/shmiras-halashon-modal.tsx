import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { AttributionSection } from "@/components/ui/attribution-section";
import { formatTextContent } from "@/lib/text-formatter";
import { Play } from "lucide-react";

export default function ShmirasHalashonModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  const isOpen = activeModal === 'shmiras-halashon';
  const isCompleted = isModalComplete('shmiras-halashon');

  const today = new Date().toISOString().split('T')[0];

  const { data: content, isLoading } = useQuery<{
    title?: string;
    content?: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    speaker?: string;
    speakerWebsite?: string;
    footnotes?: string;
    thankYouMessage?: string;
    attributionLogoUrl?: string;
    attributionAboutText?: string;
  }>({
    queryKey: ['/api/torah/shmiras-halashon', today],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const handleComplete = () => {
    trackModalComplete('shmiras-halashon');
    markModalComplete('shmiras-halashon');
    completeTask('torah');
    setShowHeartExplosion(true);
    setTimeout(() => {
      setShowHeartExplosion(false);
      
      if (checkAndShowCongratulations('torah')) {
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
      title="Shemiras Halashon"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading content...</p>
        </div>
      ) : content ? (
        <div className="space-y-4">
          {content.title && (
            <div className="bg-blush/10 rounded-2xl px-4 py-3 border border-blush/20">
              <h3 className="text-base platypi-bold text-black text-center">
                {content.title}
              </h3>
            </div>
          )}

          {content.speaker && (
            <div className="text-center">
              <span className="text-sm platypi-medium text-black/70">
                {content.speakerWebsite ? (
                  <a 
                    href={content.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blush"
                  >
                    {content.speaker}
                  </a>
                ) : content.speaker}
              </span>
            </div>
          )}

          {content.imageUrl && (
            <div className="rounded-xl overflow-hidden">
              <img 
                src={content.imageUrl} 
                alt={content.title || 'Shmiras Halashon'} 
                className="w-full h-auto"
              />
            </div>
          )}

          {content.audioUrl && (
            <AudioPlayer
              title={content.title || 'Shmiras Halashon'}
              duration="5:00"
              audioUrl={content.audioUrl}
              onAudioEnded={handleComplete}
            />
          )}

          {content.videoUrl && (
            <div className="rounded-xl overflow-hidden aspect-video relative bg-black">
              {!videoStarted ? (
                <button
                  onClick={() => setVideoStarted(true)}
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/20 to-black/40 hover:from-black/30 hover:to-black/50 transition-all group"
                >
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-blush ml-1" fill="currentColor" />
                  </div>
                </button>
              ) : (
                <iframe
                  src={`${content.videoUrl}${content.videoUrl.includes('?') ? '&' : '?'}autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          )}

          {content.content && (
            <div 
              className="platypi-regular text-black leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatTextContent(content.content) }}
            />
          )}

          {content.footnotes && (
            <div className="mt-4 pt-4 border-t border-blush/20">
              <div 
                className="text-xs text-black/60 platypi-regular"
                dangerouslySetInnerHTML={{ __html: formatTextContent(content.footnotes) }}
              />
            </div>
          )}

          {content.thankYouMessage && (
            <AttributionSection
              label={content.thankYouMessage}
              logoUrl={content.attributionLogoUrl}
              aboutText={content.attributionAboutText}
            />
          )}

          <HeartExplosion trigger={showHeartExplosion} />

          <div className="pt-4">
            <Button
              onClick={handleComplete}
              disabled={isCompleted}
              className={`w-full py-3 rounded-xl platypi-bold text-white transition-all ${
                isCompleted 
                  ? 'bg-sage/50 cursor-not-allowed' 
                  : 'bg-gradient-feminine hover:opacity-90'
              }`}
            >
              {isCompleted ? 'Completed' : 'Mark Complete'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-black/60">No content available for today</p>
        </div>
      )}
    </FullscreenModal>
  );
}
