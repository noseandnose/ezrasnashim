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
    <Dialog open={activeModal === 'congratulations'} onOpenChange={() => closeModal()}>
      <DialogContent className="w-full max-w-sm rounded-3xl p-8 platypi-regular text-center relative overflow-hidden">
        {/* Large Background Flower - Behind everything */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img 
            src={stage3Image} 
            alt="Beautiful flower bouquet - Full completions!" 
            className="w-80 h-80 object-contain opacity-30"
          />
        </div>

        {/* Content on top of flower */}
        <div className="relative z-10">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-2xl platypi-bold text-black text-center">
              Mazal Tov!
            </DialogTitle>
            <DialogDescription className="text-warm-gray/80 mb-16 leading-relaxed">
                You have completed all three daily Mitzvahs: Torah learning, Tefilla, and Tzedaka. 
                May your spiritual growth continue and bring you and your family abundant blessings.
              </DialogDescription>
          </DialogHeader>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}