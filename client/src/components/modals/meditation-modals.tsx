import { useModalStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Brain, Play, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MeditationCategory[]>({
    queryKey: ['/api/meditations/categories'],
    enabled: activeModal === 'meditation-categories',
  });

  const { data: allMeditations = [], isLoading: meditationsLoading } = useQuery<Meditation[]>({
    queryKey: ['/api/meditations/all'],
    enabled: activeModal === 'meditation-categories',
  });

  const meditationsBySection = allMeditations.reduce((acc, med) => {
    if (!acc[med.section]) {
      acc[med.section] = [];
    }
    acc[med.section].push(med);
    return acc;
  }, {} as Record<string, Meditation[]>);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleMeditationSelect = (meditation: Meditation) => {
    setSelectedMeditation(meditation);
    openModal('meditation-player', 'table');
  };

  const isLoading = categoriesLoading || meditationsLoading;

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
            {categories.map((category) => {
              const sectionMeditations = meditationsBySection[category.section] || [];
              const isExpanded = expandedSections.has(category.section);
              
              return (
                <div 
                  key={category.section}
                  className="bg-white rounded-2xl border border-blush/10 shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(category.section)}
                    className="w-full p-4 text-left flex items-center gap-3 hover:bg-blush/5 transition-colors"
                    data-testid={`button-section-${category.section.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="p-2 rounded-full bg-gradient-feminine flex-shrink-0">
                      <Brain className="text-white" size={20} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="platypi-bold text-base text-black">{category.section}</h3>
                      <p className="platypi-regular text-xs text-black/60">{category.subtitle}</p>
                    </div>
                    <div className="flex-shrink-0 p-1">
                      {isExpanded ? (
                        <ChevronUp className="text-blush" size={20} />
                      ) : (
                        <ChevronDown className="text-blush" size={20} />
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && sectionMeditations.length > 0 && (
                    <div className="border-t border-blush/10 bg-blush/5">
                      {sectionMeditations.map((meditation) => (
                        <button
                          key={meditation.id}
                          onClick={() => handleMeditationSelect(meditation)}
                          className="w-full p-3 pl-14 text-left flex items-center gap-3 hover:bg-blush/10 transition-colors border-b border-blush/5 last:border-b-0"
                          data-testid={`button-meditation-${meditation.id}`}
                        >
                          <div className="p-1.5 rounded-full bg-white border border-blush/20 flex-shrink-0">
                            <Play className="text-blush" size={14} strokeWidth={2} />
                          </div>
                          <span className="platypi-medium text-sm text-black">{meditation.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
              ? 'bg-sage text-white cursor-not-allowed opacity-70' 
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
