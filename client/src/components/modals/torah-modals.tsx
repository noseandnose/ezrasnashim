import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
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

  const handleTorahComplete = () => {
    setShowExplosion(true);
    
    // Wait for animation to complete before proceeding
    setTimeout(() => {
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

  const { data: halachaContent } = useQuery<any>({
    queryKey: ['/api/torah/halacha', today],
    queryFn: () => fetch(`/api/torah/halacha/${today}`).then(res => res.json()),
    enabled: activeModal === 'halacha'
  });

  const { data: mussarContent } = useQuery<any>({
    queryKey: ['/api/torah/mussar', today],
    queryFn: () => fetch(`/api/torah/mussar/${today}`).then(res => res.json()),
    enabled: activeModal === 'mussar'
  });

  const { data: chizukContent } = useQuery<any>({
    queryKey: ['/api/torah/chizuk', today],
    queryFn: () => fetch(`/api/torah/chizuk/${today}`).then(res => res.json()),
    enabled: activeModal === 'chizuk'
  });

  const { data: loshonContent } = useQuery<any>({
    queryKey: ['/api/torah/loshon', today],
    queryFn: () => fetch(`/api/torah/loshon/${today}`).then(res => res.json()),
    enabled: activeModal === 'loshon'
  });

  const { data: pirkeiAvotContent } = useQuery<any>({
    queryKey: ['/api/torah/pirkei-avot', today],
    queryFn: () => fetch(`/api/torah/pirkei-avot/${today}`).then(res => res.json()),
    enabled: activeModal === 'pirkei-avot'
  });

  return (
    <>
      {/* Halacha Modal */}
      <Dialog open={activeModal === 'halacha'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold mb-2">Daily Halacha</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 font-sans">{halachaContent?.title || "Laws of Chanukah - Day 3"}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 text-sm text-gray-700 font-sans">
            <div>
              <p><strong>Today's Halacha:</strong> {halachaContent?.content || "Candles should be lit immediately after sunset, and should burn for at least 30 minutes. The mitzvah is to light one candle each night, with the minhag to add an additional candle each subsequent night."}</p>
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

      {/* Mussar Modal */}
      <Dialog open={activeModal === 'mussar'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm max-h-[80vh] overflow-y-auto modal-content rounded-3xl p-6 font-sans">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold mb-2">Daily Mussar</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 font-sans">Character Development</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 text-sm text-gray-700 font-sans">
            <div>
              <p><strong>Today's Focus:</strong> Patience and understanding in our daily interactions.</p>
              <p className="mt-2">When we encounter challenges, remember that each test is an opportunity for growth and spiritual elevation.</p>
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

      {/* Chizuk Modal */}
      <Dialog open={activeModal === 'chizuk'} onOpenChange={() => closeModal()}>
        <DialogContent>
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold mb-2">Daily Chizuk</DialogTitle>
            <DialogDescription>Daily inspiration and spiritual strengthening</DialogDescription>
            <p className="text-sm text-gray-600 mb-4">
              {chizukContent?.title || "Inspiration & Strength"}
            </p>
          </DialogHeader>
          
          <AudioPlayer 
            title={chizukContent?.title || "Daily Chizuk"}
            duration={chizukContent?.duration || "5:15"}
            audioUrl={chizukContent?.audioUrl || ""}
          />
          
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
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Loshon Horah</DialogTitle>
            <p className="text-sm text-gray-600">Guarding Our Speech</p>
          </DialogHeader>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p><strong>Today's Lesson:</strong> Before speaking about others, ask yourself: Is it true? Is it necessary? Is it kind?</p>
              <p className="mt-2">Positive speech has the power to build relationships and create harmony in our communities.</p>
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

      {/* Pirkei Avot Modal */}
      <Dialog open={activeModal === 'pirkei-avot'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Pirkei Avot</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">Ethics of the Fathers</DialogDescription>
          </DialogHeader>
          
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