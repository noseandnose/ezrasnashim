import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Headphones, FileText, Video, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { AttributionSection } from "@/components/ui/attribution-section";
import { getHebrewFontClass, getTextDirection } from "@/lib/hebrewUtils";
import { formatThankYouMessageFull } from "@/lib/link-formatter";
import type { TorahClass } from "@shared/schema";

interface Speaker {
  speaker: string;
  imageUrl: string | null;
  contentCount: number;
}

type LibraryView = 'speakers' | 'content-list' | 'content-detail';

export default function LibraryModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  
  const [view, setView] = useState<LibraryView>('speakers');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [triggerHeartExplosion, setTriggerHeartExplosion] = useState(false);

  const isOpen = activeModal === 'library';

  const { data: speakers, isLoading: speakersLoading } = useQuery<Speaker[]>({
    queryKey: ['/api/library/speakers'],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: speakerContent, isLoading: contentLoading } = useQuery<TorahClass[]>({
    queryKey: ['/api/library/speakers', selectedSpeaker],
    enabled: isOpen && view === 'content-list' && !!selectedSpeaker,
    staleTime: 5 * 60 * 1000,
  });

  const { data: contentDetail, isLoading: detailLoading } = useQuery<TorahClass>({
    queryKey: ['/api/library/content', selectedContentId],
    enabled: isOpen && view === 'content-detail' && !!selectedContentId,
    staleTime: 5 * 60 * 1000,
  });

  const handleSelectSpeaker = useCallback((speaker: string) => {
    setSelectedSpeaker(speaker);
    setView('content-list');
  }, []);

  const handleSelectContent = useCallback((id: number) => {
    setSelectedContentId(id);
    setView('content-detail');
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'content-detail') {
      setView('content-list');
      setSelectedContentId(null);
    } else if (view === 'content-list') {
      setView('speakers');
      setSelectedSpeaker(null);
    }
  }, [view]);

  const handleClose = useCallback(() => {
    setView('speakers');
    setSelectedSpeaker(null);
    setSelectedContentId(null);
    closeModal();
  }, [closeModal]);

  const handleComplete = useCallback(() => {
    const modalId = `library-${selectedContentId}`;
    trackModalComplete(modalId);
    markModalComplete(modalId);
    completeTask('torah');
    setTriggerHeartExplosion(true);
    setTimeout(() => {
      setTriggerHeartExplosion(false);
      if (checkAndShowCongratulations()) {
        openModal('congratulations', 'torah');
      } else {
        setView('content-list');
        setSelectedContentId(null);
      }
    }, 1000);
  }, [selectedContentId, trackModalComplete, markModalComplete, completeTask, checkAndShowCongratulations, openModal]);

  const getTitle = () => {
    if (view === 'content-detail' && contentDetail) {
      return contentDetail.title;
    }
    if (view === 'content-list' && selectedSpeaker) {
      return selectedSpeaker;
    }
    return 'Library';
  };

  const renderSpeakers = () => (
    <div className="grid grid-cols-2 gap-3 pb-20">
      {speakersLoading ? (
        <div className="col-span-2 text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading speakers...</p>
        </div>
      ) : speakers && speakers.length > 0 ? (
        speakers.map((speaker) => (
          <button
            key={speaker.speaker}
            onPointerDown={() => handleSelectSpeaker(speaker.speaker)}
            className="bg-white/80 rounded-2xl p-4 border border-blush/20 text-center hover:bg-white/90 transition-colors"
            data-testid={`button-speaker-${speaker.speaker.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {speaker.imageUrl ? (
              <img 
                src={speaker.imageUrl} 
                alt={speaker.speaker}
                className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                loading="lazy"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-feminine flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            )}
            <h3 className="platypi-bold text-sm text-black line-clamp-2">{speaker.speaker}</h3>
            <p className="text-xs text-black/60 mt-1">{speaker.contentCount} {speaker.contentCount === 1 ? 'lesson' : 'lessons'}</p>
          </button>
        ))
      ) : (
        <div className="col-span-2 text-center py-8">
          <BookOpen className="w-12 h-12 text-blush/40 mx-auto mb-2" />
          <p className="text-black/60">No content available yet</p>
        </div>
      )}
    </div>
  );

  const renderContentList = () => (
    <div className="space-y-2 pb-20">
      <button
        onPointerDown={handleBack}
        className="flex items-center gap-2 text-blush mb-3"
        data-testid="button-back-to-speakers"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to speakers</span>
      </button>
      {contentLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading content...</p>
        </div>
      ) : speakerContent && speakerContent.length > 0 ? (
        speakerContent.map((item) => (
          <button
            key={item.id}
            onPointerDown={() => handleSelectContent(item.id)}
            className="w-full bg-white/80 rounded-xl p-4 border border-blush/20 text-left hover:bg-white/90 transition-colors flex items-center gap-3"
            data-testid={`button-content-${item.id}`}
          >
            <div className="flex-grow">
              <h3 className="platypi-bold text-sm text-black">{item.title}</h3>
              {item.subtitle && (
                <p className="text-xs text-black/60 mt-0.5">{item.subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {item.audioUrl && <Headphones className="w-4 h-4 text-blush" />}
              {item.videoUrl && <Video className="w-4 h-4 text-blush" />}
              {item.content && <FileText className="w-4 h-4 text-blush" />}
              <ChevronRight className="w-4 h-4 text-black/40" />
            </div>
          </button>
        ))
      ) : (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-blush/40 mx-auto mb-2" />
          <p className="text-black/60">No content found</p>
        </div>
      )}
    </div>
  );

  const renderContentDetail = () => (
    <div className="space-y-4 pb-20">
      <button
        onPointerDown={handleBack}
        className="flex items-center gap-2 text-blush mb-3"
        data-testid="button-back-to-content-list"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to {selectedSpeaker}</span>
      </button>
      {detailLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading content...</p>
        </div>
      ) : contentDetail ? (
        <>
          {contentDetail.speaker && (
            <div className="bg-blush/10 rounded-2xl px-4 py-3 border border-blush/20">
              <span className="text-sm platypi-medium text-black">
                By {contentDetail.speaker}
                {contentDetail.speakerWebsite && (
                  <a 
                    href={contentDetail.speakerWebsite} 
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

          {contentDetail.content && (
            <div className="bg-white rounded-2xl p-6 border border-blush/10">
              <div 
                className={`${getHebrewFontClass(contentDetail.content, 'koren-siddur-english')} text-base leading-relaxed text-black`}
                dir={getTextDirection(contentDetail.content)}
                style={{ textAlign: getTextDirection(contentDetail.content) === 'rtl' ? 'right' : 'left' }}
                dangerouslySetInnerHTML={{ __html: formatThankYouMessageFull(contentDetail.content) }}
              />
            </div>
          )}

          {contentDetail.imageUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <img 
                src={contentDetail.imageUrl} 
                alt="Source material"
                className="w-full rounded-lg"
                loading="lazy"
              />
            </div>
          )}

          {contentDetail.videoUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={contentDetail.videoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {contentDetail.audioUrl && (
            <div className="bg-white rounded-2xl p-4 border border-blush/10">
              <AudioPlayer 
                audioUrl={contentDetail.audioUrl} 
                title={contentDetail.title || 'Audio Content'}
                duration=""
                onAudioEnded={handleComplete}
              />
            </div>
          )}

          {contentDetail.thankYouMessage && (
            <AttributionSection
              label={contentDetail.thankYouMessage}
              labelHtml={true}
              logoUrl={contentDetail.attributionLogoUrl}
              aboutText={contentDetail.attributionAboutText}
              websiteUrl={contentDetail.speakerWebsite}
            />
          )}

          <Button
            onPointerDown={handleComplete}
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium"
            data-testid="button-complete-library-content"
          >
            Mark as Complete
          </Button>

          <HeartExplosion trigger={triggerHeartExplosion} />
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-black/60">Content not found</p>
        </div>
      )}
    </div>
  );

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
    >
      {view === 'speakers' && renderSpeakers()}
      {view === 'content-list' && renderContentList()}
      {view === 'content-detail' && renderContentDetail()}
    </FullscreenModal>
  );
}
