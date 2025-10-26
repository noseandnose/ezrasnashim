import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useModalStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Brain, Play, Pause, SkipBack, SkipForward, X } from "lucide-react";

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
        <DialogContent className="dialog-content w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="meditation-categories-description">
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
        <DialogContent className="dialog-content w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular" aria-describedby="meditation-list-description">
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

// Audio Player Component
function MeditationAudioPlayer({ 
  meditation, 
  isOpen, 
  onClose 
}: { 
  meditation: Meditation | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reset audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Track completion
      trackMeditationComplete();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const trackMeditationComplete = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/event`, {
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

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  };

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!meditation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog-content w-full max-w-md rounded-3xl p-6 platypi-regular" aria-describedby="meditation-player-description">
        <div id="meditation-player-description" className="sr-only">Meditation audio player</div>
        
        <div className="flex items-center justify-between mb-6">
          <DialogTitle className="text-xl platypi-bold text-black">{meditation.name}</DialogTitle>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            data-testid="button-close-player"
          >
            <X className="w-5 h-5 text-black/70" />
          </button>
        </div>

        {/* Audio Element */}
        <audio ref={audioRef} src={meditation.link} />

        {/* Album Art / Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="p-8 rounded-full bg-gradient-feminine">
            <Brain className="text-white w-16 h-16" strokeWidth={1.5} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blush"
            data-testid="slider-progress"
          />
          <div className="flex justify-between text-xs text-black/60 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <button
            onClick={skipBackward}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
            data-testid="button-skip-back"
          >
            <SkipBack className="w-6 h-6 text-black/70" />
          </button>

          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-gradient-feminine hover:scale-110 transition-transform"
            data-testid="button-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" fill="white" />
            ) : (
              <Play className="w-8 h-8 text-white" fill="white" />
            )}
          </button>

          <button
            onClick={skipForward}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
            data-testid="button-skip-forward"
          >
            <SkipForward className="w-6 h-6 text-black/70" />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center justify-center">
          <button
            onClick={changeSpeed}
            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm platypi-medium text-black"
            data-testid="button-speed"
          >
            Speed: {playbackSpeed}x
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
