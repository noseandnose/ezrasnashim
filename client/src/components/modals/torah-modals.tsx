import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useModalStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";

export default function TorahModals() {
  const { activeModal, closeModal } = useModalStore();

  const today = new Date().toISOString().split('T')[0];

  const { data: halachaContent } = useQuery<any>({
    queryKey: ['/api/torah/halacha', today],
    enabled: activeModal === 'halacha'
  });

  const { data: mussarContent } = useQuery<any>({
    queryKey: ['/api/torah/mussar', today],
    enabled: activeModal === 'mussar'
  });

  const { data: chizukContent } = useQuery<any>({
    queryKey: ['/api/torah/chizuk', today],
    enabled: activeModal === 'chizuk'
  });

  const { data: loshonContent } = useQuery<any>({
    queryKey: ['/api/torah/loshon', today],
    enabled: activeModal === 'loshon'
  });

  return (
    <>
      {/* Halacha Modal */}
      <Dialog open={activeModal === 'halacha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm max-h-[80vh] overflow-y-auto modal-content rounded-3xl p-6 font-sans">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-serif font-semibold mb-2">Daily Halacha</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 font-sans">{halachaContent?.title || "Laws of Chanukah - Day 3"}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 text-sm text-gray-700 font-sans">
            <div>
              <p><strong>Today's Halacha:</strong> {halachaContent?.content || "Candles should be lit immediately after sunset, and should burn for at least 30 minutes. The mitzvah is to light one candle each night, with the minhag to add an additional candle each subsequent night."}</p>
            </div>
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
        </DialogContent>
      </Dialog>

      {/* Chizuk Modal */}
      <Dialog open={activeModal === 'chizuk'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold mb-2">Daily Chizuk</DialogTitle>
            <DialogDescription>Daily inspiration and spiritual strengthening</DialogDescription>
            <p className="text-sm text-gray-600 mb-4">
              {chizukContent?.title || "Inspiration & Strength"}
            </p>
          </DialogHeader>
          
          <AudioPlayer 
            title={chizukContent?.title || "Daily Chizuk"}
            duration="5:15"
            audioUrl={chizukContent?.audioUrl || ""}
          />
        </DialogContent>
      </Dialog>

      {/* Loshon Horah Modal */}
      <Dialog open={activeModal === 'loshon'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm max-h-[80vh] overflow-y-auto modal-content rounded-3xl p-6">
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
        </DialogContent>
      </Dialog>
    </>
  );
}