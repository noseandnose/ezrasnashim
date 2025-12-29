import { useModalStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Play } from "lucide-react";
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
  const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MeditationCategory[]>({
    queryKey: ['/api/meditations/categories'],
    enabled: activeModal === 'meditation-categories',
  });

  const { data: allMeditations = [], isLoading: meditationsLoading } = useQuery<Meditation[]>({
    queryKey: ['/api/meditations/all'],
    enabled: activeModal === 'meditation-categories',
  });

  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].section);
    }
  }, [categories, activeTab]);

  const meditationsBySection = allMeditations.reduce((acc, med) => {
    if (!acc[med.section]) {
      acc[med.section] = [];
    }
    acc[med.section].push(med);
    return acc;
  }, {} as Record<string, Meditation[]>);

  const handleMeditationSelect = (meditation: Meditation) => {
    setSelectedMeditation(meditation);
    openModal('meditation-player', 'table');
  };

  const isLoading = categoriesLoading || meditationsLoading;
  const activeMeditations = meditationsBySection[activeTab] || [];

  return (
    <>
      <FullscreenModal
        isOpen={activeModal === 'meditation-categories'}
        onClose={() => closeModal()}
        title="Meditations"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blush border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex rounded-2xl bg-blush/10 p-1 border border-blush/20">
              {categories.map((category) => (
                <button
                  key={category.section}
                  onClick={() => setActiveTab(category.section)}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-center transition-all duration-200 ${
                    activeTab === category.section
                      ? 'bg-gradient-feminine text-white shadow-lg'
                      : 'text-black/70 hover:bg-blush/10'
                  }`}
                  data-testid={`tab-category-${category.section.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className="platypi-semibold text-xs leading-tight block">
                    {category.section}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {activeMeditations.map((meditation) => (
                <button
                  key={meditation.id}
                  onClick={() => handleMeditationSelect(meditation)}
                  className="w-full rounded-2xl p-4 text-left hover:scale-[1.02] transition-all duration-200 shadow-lg border border-blush/10 bg-white"
                  data-testid={`button-meditation-${meditation.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-feminine flex-shrink-0">
                      <Play className="text-white" size={16} strokeWidth={2} />
                    </div>
                    <span className="platypi-medium text-sm text-black">{meditation.name}</span>
                  </div>
                </button>
              ))}
              
              {activeMeditations.length === 0 && (
                <div className="text-center py-8 text-black/50 platypi-regular">
                  No meditations available in this category
                </div>
              )}
            </div>
          </div>
        )}
      </FullscreenModal>

      <MeditationAudioPlayer 
        meditation={selectedMeditation}
        isOpen={activeModal === 'meditation-player'}
        onClose={() => closeModal(true)}
      />
    </>
  );
}

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
              ? 'bg-sage text-white' 
              : 'bg-gradient-feminine text-white hover:scale-105 transition-transform complete-button-pulse'
          }`}
          data-testid="button-complete-meditation"
        >
          {isCompleted ? 'Completed Today' : 'Complete'}
        </Button>

        <HeartExplosion trigger={showExplosion} />
      </div>
    </FullscreenModal>
  );
}
