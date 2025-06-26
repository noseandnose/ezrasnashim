import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import AudioPlayer from "@/components/audio-player";
import { HeartExplosion } from "@/components/ui/heart-explosion";

interface TorahModalsProps {
  onSectionChange?: (section: any) => void;
}

export default function TorahModals({ onSectionChange }: TorahModalsProps) {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const [, setLocation] = useLocation();
  const [showExplosion, setShowExplosion] = useState(false);

  // Reset explosion state when modal changes
  useEffect(() => {
    setShowExplosion(false);
  }, [activeModal]);

  const handleTorahComplete = () => {
    setShowExplosion(true);
    
    // Wait for animation to complete before proceeding
    setTimeout(() => {
      setShowExplosion(false); // Reset explosion state
      completeTask('torah');
      closeModal();
      
      // Navigate to home section to show progress
      if (onSectionChange) {
        onSectionChange('home');
      }
      
      // Check if all tasks are completed and show congratulations
      setTimeout(() => {
        if (checkAndShowCongratulations()) {
          openModal('congratulations');
        }
      }, 200);
    }, 500);
  };

  const today = new Date().toISOString().split('T')[0];

  const { data: halachaContent } = useQuery<{title?: string; content?: string; source?: string; provider?: string; speakerWebsite?: string}>({
    queryKey: ['/api/torah/halacha', today],
    queryFn: () => fetch(`/api/torah/halacha/${today}`).then(res => res.json()),
    enabled: activeModal === 'halacha',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });

  const { data: mussarContent } = useQuery<{title?: string; content?: string; audioUrl?: string; source?: string; duration?: string; author?: string; speaker?: string; provider?: string; speakerWebsite?: string}>({
    queryKey: ['/api/torah/mussar', today],
    queryFn: () => fetch(`/api/torah/mussar/${today}`).then(res => res.json()),
    enabled: activeModal === 'mussar',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: chizukContent } = useQuery<{title?: string; content?: string; audioUrl?: string; source?: string; duration?: string; speaker?: string; provider?: string; speakerWebsite?: string}>({
    queryKey: ['/api/torah/chizuk', today],
    queryFn: () => fetch(`/api/torah/chizuk/${today}`).then(res => res.json()),
    enabled: activeModal === 'chizuk',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: loshonContent } = useQuery<{title?: string; content?: string; halachicSource?: string; practicalTip?: string; provider?: string; speakerWebsite?: string}>({
    queryKey: ['/api/torah/loshon', today],
    queryFn: () => fetch(`/api/torah/loshon/${today}`).then(res => res.json()),
    enabled: activeModal === 'loshon',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: pirkeiAvotContent } = useQuery<Record<string, any>>({
    queryKey: ['/api/torah/pirkei-avot', today],
    queryFn: () => fetch(`/api/torah/pirkei-avot/${today}`).then(res => res.json()),
    enabled: activeModal === 'pirkei-avot',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  return (
    <>
      {/* Halacha Modal */}
      <Dialog open={activeModal === 'halacha'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby="halacha-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold mb-2">Daily Halacha</DialogTitle>
            {halachaContent && (
              <DialogDescription className="text-sm text-gray-600 font-sans">{halachaContent.title}</DialogDescription>
            )}
          </DialogHeader>
          <div id="halacha-description" className="sr-only">Daily Jewish law and practice content</div>
          
          {halachaContent && (
            <div className="space-y-3 text-sm text-gray-700 font-sans">
              <div>
                <p><strong>Today's Halacha:</strong> {halachaContent.content}</p>
                {halachaContent.source && (
                  <p className="mt-2 text-xs text-gray-500">Source: {halachaContent.source}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Thank You Section */}
          {halachaContent?.provider && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🙏 Thank you to {halachaContent.provider}
              </p>
              {halachaContent.speakerWebsite && (
                <p className="text-sm text-blue-800">
                  <a 
                    href={halachaContent.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          )}
          
          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mussar Modal */}
      <Dialog open={activeModal === 'mussar'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby="mussar-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold mb-2">Daily Mussar</DialogTitle>
            {mussarContent && (
              <DialogDescription className="text-sm text-gray-600 font-sans">{mussarContent.title}</DialogDescription>
            )}
          </DialogHeader>
          <div id="mussar-description" className="sr-only">Daily character development and spiritual growth content</div>
          
          {mussarContent && mussarContent.audioUrl && (
            <div className="space-y-4">
              <AudioPlayer 
                title={mussarContent.title || 'Mussar'}
                duration={mussarContent.duration || "10:00"}
                audioUrl={mussarContent.audioUrl}
              />
              {mussarContent.speaker && (
                <p className="text-sm text-gray-600 text-center">
                  <strong>Speaker:</strong> {mussarContent.speaker}
                </p>
              )}
            </div>
          )}
          
          {mussarContent && !mussarContent.audioUrl && (
            <div className="space-y-3 text-sm text-gray-700 font-sans">
              <div>
                <p><strong>Today's Focus:</strong> {mussarContent.content}</p>
                {mussarContent.author && (
                  <p className="mt-2 text-xs text-gray-500">Author: {mussarContent.author}</p>
                )}
                {mussarContent.source && (
                  <p className="mt-1 text-xs text-gray-500">Source: {mussarContent.source}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Thank You Section */}
          {mussarContent?.provider && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🙏 Thank you to {mussarContent.provider}
              </p>
              {mussarContent.speakerWebsite && (
                <p className="text-sm text-blue-800">
                  <a 
                    href={mussarContent.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Chizuk Modal */}
      <Dialog open={activeModal === 'chizuk'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby="chizuk-description">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold mb-2">Daily Chizuk</DialogTitle>
            <DialogDescription>Daily inspiration and spiritual strengthening</DialogDescription>
            {chizukContent && (
              <p className="text-sm text-gray-600 mb-4">
                {chizukContent.title}
              </p>
            )}
          </DialogHeader>
          <div id="chizuk-description" className="sr-only">5-minute daily inspiration and spiritual strengthening content</div>
          
          {chizukContent && chizukContent.audioUrl && (
            <div className="space-y-4">
              <AudioPlayer 
                title={chizukContent.title || 'Chizuk'}
                duration={chizukContent.duration || "5:15"}
                audioUrl={chizukContent.audioUrl}
              />
              {chizukContent.speaker && (
                <p className="text-sm text-gray-600 text-center">
                  <strong>Speaker:</strong> {chizukContent.speaker}
                </p>
              )}
            </div>
          )}
          
          {/* Thank You Section */}
          {chizukContent?.provider && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🙏 Thank you to {chizukContent.provider}
              </p>
              {chizukContent.speakerWebsite && (
                <p className="text-sm text-blue-800">
                  <a 
                    href={chizukContent.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Loshon Horah Modal */}
      <Dialog open={activeModal === 'loshon'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby="loshon-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Loshon Horah</DialogTitle>
            {loshonContent && (
              <DialogDescription className="text-sm text-gray-600 font-sans">{loshonContent.title}</DialogDescription>
            )}
          </DialogHeader>
          <div id="loshon-description" className="sr-only">Daily teachings about proper speech and guarding one's tongue</div>
          
          {loshonContent && (
            <div className="space-y-3 text-sm text-gray-700 font-sans">
              <div>
                <p><strong>Today's Lesson:</strong> {loshonContent.content}</p>
                {loshonContent.halachicSource && (
                  <p className="mt-2 text-xs text-gray-500">Source: {loshonContent.halachicSource}</p>
                )}
                {loshonContent.practicalTip && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700">Practical Tip:</p>
                    <p className="text-xs text-gray-600 mt-1">{loshonContent.practicalTip}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Thank You Section */}
          {loshonContent?.provider && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🙏 Thank you to {loshonContent.provider}
              </p>
              {loshonContent.speakerWebsite && (
                <p className="text-sm text-blue-800">
                  <a 
                    href={loshonContent.speakerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Pirkei Avot Modal */}
      <Dialog open={activeModal === 'pirkei-avot'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby="pirkei-avot-description">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Pirkei Avot</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">Ethics of the Fathers</DialogDescription>
          </DialogHeader>
          <div id="pirkei-avot-description" className="sr-only">Ethics of the Fathers - timeless wisdom from Jewish sages</div>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p><strong>Today's Teaching:</strong> {pirkeiAvotContent?.content || "Shimon his son says: All my days I have grown up among the wise, and I have found nothing better for the body than silence."}</p>
              <p className="mt-2 text-xs text-gray-500">- {pirkeiAvotContent?.source || "Pirkei Avot 1:17"}</p>
              <p className="mt-3">{pirkeiAvotContent?.explanation || "This mishnah teaches us the value of thoughtful speech and careful listening. True wisdom often comes through quiet contemplation and attentive observation of those wiser than ourselves."}</p>
            </div>
          </div>
          
          <div className="heart-explosion-container">
            <Button 
              onClick={handleTorahComplete} 
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium mt-6 border-0"
            >
              Complete
            </Button>
            <HeartExplosion trigger={showExplosion} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}