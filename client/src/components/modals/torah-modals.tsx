import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModalStore } from "@/lib/types";

export default function TorahModals() {
  const { activeModal, closeModal } = useModalStore();

  return (
    <>
      {/* Halacha Modal */}
      <Dialog open={activeModal === 'halacha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm max-h-[80vh] overflow-y-auto modal-content rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Daily Halacha</DialogTitle>
            <p className="text-sm text-gray-600">Laws of Chanukah - Day 3</p>
          </DialogHeader>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p><strong>Today's Halacha:</strong> Candles should be lit immediately after sunset, and should burn for at least 30 minutes.</p>
              <p className="mt-2"><strong>Additional Guidelines:</strong> The mitzvah is to light one candle each night, with the minhag to add an additional candle each subsequent night.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mussar Modal */}
      <Dialog open={activeModal === 'mussar'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm max-h-[80vh] overflow-y-auto modal-content rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Daily Mussar</DialogTitle>
            <p className="text-sm text-gray-600">Character Development</p>
          </DialogHeader>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p><strong>Today's Focus:</strong> Patience and understanding in our daily interactions.</p>
              <p className="mt-2">When we encounter challenges, remember that each test is an opportunity for growth and spiritual elevation.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chizuk Modal */}
      <Dialog open={activeModal === 'chizuk'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm max-h-[80vh] overflow-y-auto modal-content rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Daily Chizuk</DialogTitle>
            <p className="text-sm text-gray-600">Inspiration & Strength</p>
          </DialogHeader>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p><strong>Today's Message:</strong> Every Jewish woman has the power to bring light into the world through her actions and intentions.</p>
              <p className="mt-2">Your role in the home and community creates ripples of kedusha that extend far beyond what you can see.</p>
            </div>
          </div>
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