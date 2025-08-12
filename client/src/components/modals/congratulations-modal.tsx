import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { useEffect } from "react";
import stage3Image from '@assets/Stage3_1753300751700.png';

export default function CongratulationsModal() {
  const { activeModal, closeModal } = useModalStore();
  const { trackModalComplete } = useTrackModalComplete();

  useEffect(() => {
    if (activeModal === 'congratulations') {
      trackModalComplete('congratulations');
    }
  }, [activeModal]);

  return (
    <Dialog open={activeModal === 'congratulations'} onOpenChange={() => closeModal(true)}>
      <DialogContent className="w-full max-w-sm rounded-3xl p-8 platypi-regular text-center">
        <div className="flex items-center justify-center mb-3 relative">
          <DialogTitle className="text-2xl platypi-bold text-black">
            Mazal Tov!
          </DialogTitle>
        </div>
        <DialogDescription className="text-warm-gray/80 mb-6 leading-relaxed">
            You have completed all three daily Mitzvahs: Torah learning, Tefilla, and Tzedaka. 
            May your spiritual growth continue and bring you and your family abundant blessings.
          </DialogDescription>

        {/* Beautiful Stage 3 Flower Image */}
        <div className="flex justify-center mb-6">
          <img 
            src={stage3Image} 
            alt="Beautiful flower bouquet - Full completions!" 
            className="w-20 h-20 object-contain"
          />
        </div>

        <Button 
          onClick={() => {
            closeModal();
            // Navigate to home and scroll to progress
            window.location.hash = '#/?section=home&scrollToProgress=true';
          }} 
          className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0"
        >
          Continue Your Journey
        </Button>
      </DialogContent>
    </Dialog>
  );
}