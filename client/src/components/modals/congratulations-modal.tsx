import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { useEffect } from "react";
import mazalTovBackground from '@assets/Mazaltov1_1766583177967.png';

export default function CongratulationsModal() {
  const { activeModal, closeModal } = useModalStore();
  const { trackModalComplete } = useTrackModalComplete();

  useEffect(() => {
    if (activeModal === 'congratulations') {
      trackModalComplete('congratulations');
    }
  }, [activeModal]);

  return (
    <DialogPrimitive.Root open={activeModal === 'congratulations'} onOpenChange={() => closeModal(true)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-3xl p-8 bg-white shadow-2xl drop-shadow-mazal-tov data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Beautiful Stage 3 Flower Image - Fill entire modal */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
            <img 
              src={mazalTovBackground} 
              alt="Beautiful flower bouquet - Full completions!" 
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          
          {/* Content above the flower image */}
          <div className="relative z-10 text-center">
            <DialogTitle className="text-2xl font-playfair font-bold text-black mb-3">
              Mazal Tov!
            </DialogTitle>
            <DialogDescription className="text-black font-bold mb-6 leading-relaxed font-inter">
              You have completed all three daily Mitzvas: Torah, Tefilla, and Tzedaka.
              <br /><br />
              On three things the world stands: on the Torah, on divine worship, and on acts of loving-kindness. (Pirkei Avot 1:2)
              <br /><br />
              Thank you for keeping it standing.
            </DialogDescription>
          </div>

          <Button 
            onClick={() => {
              closeModal();
              // Navigate to home and scroll to progress
              window.location.hash = '#/?section=home&scrollToProgress=true';
            }} 
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-inter font-medium border-0 relative z-10"
          >
            Do more Mitzvas
          </Button>
          
          {/* Close button */}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full w-8 h-8 bg-warm-gray/10 hover:bg-warm-gray/20 flex items-center justify-center transition-all duration-200">
            <span className="text-warm-gray text-lg">×</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}