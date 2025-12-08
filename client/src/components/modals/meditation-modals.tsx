import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useModalStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Brain, Play } from "lucide-react";
import AudioPlayer from "@/components/audio-player";
import { Button } from "@/components/ui/button";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { AttributionSection } from "@/components/ui/attribution-section";

interface MeditationCategory {
  section: string;
  subtitle: string;
}

interface Meditation {
  id: number;
  section: string;
  subtitle: string;
  name: string;
  link: string;
  attributionLabel?: string;
  attributionLogoUrl?: string;
  attributionAboutText?: string;
}

export default function MeditationModals() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const [selectedSection, setSelectedSection] = useState<string>("");

  // Fetch meditation categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MeditationCategory[]>({
    queryKey: ['/api/meditations/categories'],
    enabled: activeModal === 'meditation-categories',
  });

  // Fetch meditations for selected category
  const { data: meditations = [], isLoading: meditationsLoading } = useQuery<Meditation[]>({
    queryKey: ['/api/meditations/section', selectedSection],
    enabled: activeModal === 'meditation-list' && !!selectedSection,
  });

  const handleCategorySelect = (section: string) => {
    setSelectedSection(section);
    openModal('meditation-list', 'table');
  };

  const handleMeditationSelect = (meditation: Meditation) => {
    // Store meditation data in modal store for audio player
    openModal('meditation-player', 'table');
    setSelectedMeditation(meditation);
  };

  const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);

  return (
    <>
      {/* Category Selection Modal */}
      <Dialog open={activeModal === 'meditation-categories'} onOpenChange={() => closeModal()}>
        <DialogContent className="dialog-content w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" data-bridge-container aria-describedby="meditation-categories-description">
          <div id="meditation-categories-description" className="sr-only">Select a meditation category</div>
          
          <div className="flex items-center justify-center mb-4 relative">
            <DialogTitle className="text-xl platypi-bold text-black">Choose a Category</DialogTitle>
          </div>

          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blush border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => handleCategorySelect(category.section)}
                  className="w-full rounded-2xl p-4 text-left hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
                  data-testid={`button-category-${category.section.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-feminine">
                      <Brain className="text-white" size={20} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="platypi-bold text-sm text-black mb-1">{category.section}</h3>
                      <p className="platypi-regular text-xs text-black/60">{category.subtitle}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Meditation List Modal */}
      <Dialog open={activeModal === 'meditation-list'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="dialog-content w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" data-bridge-container aria-describedby="meditation-list-description">
          <div id="meditation-list-description" className="sr-only">Select a meditation to listen</div>
          
          <div className="flex items-center justify-center mb-4 relative">
            <DialogTitle className="text-xl platypi-bold text-black">{selectedSection}</DialogTitle>
          </div>

          {meditationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blush border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {meditations.map((meditation) => (
                <button
                  key={meditation.id}
                  onClick={() => handleMeditationSelect(meditation)}
                  className="w-full rounded-2xl p-4 text-left hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
                  data-testid={`button-meditation-${meditation.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-feminine">
                      <Play className="text-white" size={18} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="platypi-bold text-sm text-black">{meditation.name}</h3>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audio Player Modal */}
      <MeditationAudioPlayer 
        meditation={selectedMeditation}
        isOpen={activeModal === 'meditation-player'}
        onClose={() => closeModal(true)}
      />
    </>
  );
}

// Audio Player Component - Fullscreen like Daily Chizuk
function MeditationAudioPlayer({ 
  meditation, 
  isOpen, 
  onClose 
}: { 
  meditation: Meditation | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showExplosion, setShowExplosion] = useState(false);

  const trackMeditationComplete = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'meditation_complete',
          eventData: { meditationId: meditation?.id }
        })
      });
    } catch (error) {
      console.error('Failed to track meditation completion:', error);
    }
  };

  const handleMeditationComplete = () => {
    if (!meditation) return;
    
    const meditationKey = `meditation-${meditation.id}`;
    trackModalComplete(meditationKey);
    markModalComplete(meditationKey);
    
    setShowExplosion(true);
    
    trackMeditationComplete();
    
    setTimeout(() => {
      setShowExplosion(false);
      onClose();
      setTimeout(() => {
        window.location.hash = '#/?section=home&scrollToProgress=true';
      }, 100);
    }, 1500);
  };

  if (!meditation) return null;

  const meditationKey = `meditation-${meditation.id}`;
  const isCompleted = isModalComplete(meditationKey);

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Meditation"
    >
      <div className="space-y-4">
        {meditation.name && (
          <div className="bg-blush/10 rounded-2xl px-4 py-3 border border-blush/20">
            <h3 className="text-base platypi-bold text-black text-center">
              {meditation.name}
            </h3>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-blush/10">
          <AudioPlayer 
            title={meditation.name || 'Meditation'}
            duration="0:00"
            audioUrl={meditation.link}
            onAudioEnded={() => {
              if (!isCompleted) {
                handleMeditationComplete();
              }
            }}
          />
        </div>

        <AttributionSection
          label={meditation.attributionLabel || "Thank you to Neshima for providing this content"}
          logoUrl={meditation.attributionLogoUrl}
          aboutText={meditation.attributionAboutText || "Neshima offers guided meditations and mindfulness practices rooted in Jewish wisdom to help you find inner peace and spiritual connection."}
          websiteUrl="https://www.neshima.co/"
          websiteLabel="Visit Website"
        />

        <Button
          onClick={isCompleted ? undefined : handleMeditationComplete}
          disabled={isCompleted}
          className={`w-full py-3 rounded-xl platypi-medium border-0 ${
            isCompleted 
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
          data-testid="button-complete-meditation"
        >
          {isCompleted ? 'Completed Today' : 'Complete Meditation'}
        </Button>

        <HeartExplosion trigger={showExplosion} />
      </div>
    </FullscreenModal>
  );
}
