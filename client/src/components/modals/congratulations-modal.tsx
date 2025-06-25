import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from ".../ui/dialog";
import { Button } from ".../ui/button";
import { useModalStore } from "./../lib/types";

export default function CongratulationsModal() {
  const { activeModal, closeModal } = useModalStore();

  return (
    <Dialog open={activeModal === 'congratulations'} onOpenChange={() => closeModal()}>
      <DialogContent className="w-full max-w-sm rounded-3xl p-8 font-sans text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-semibold text-warm-gray mb-4">
            Mazal Tov!
          </DialogTitle>
          <DialogDescription className="text-warm-gray/80 mb-6 leading-relaxed">
            You have completed all three daily Mitzvahs: Torah learning, Tefilla, and Tzedaka. 
            May your spiritual growth continue and bring you and your family abundant blessings.
          </DialogDescription>
        </DialogHeader>

        {/* Flower SVG in color scheme */}
        <div className="flex justify-center mb-6">
          <svg width="80" height="80" viewBox="0 0 100 100" className="text-blush">
            {/* Flower petals */}
            <g fill="currentColor" opacity="0.8">
              {/* Top petal */}
              <ellipse cx="50" cy="25" rx="8" ry="15" fill="#E8B4CB"/>
              {/* Top right petal */}
              <ellipse cx="65" cy="35" rx="8" ry="15" transform="rotate(45 65 35)" fill="#F4A6CD"/>
              {/* Right petal */}
              <ellipse cx="75" cy="50" rx="8" ry="15" transform="rotate(90 75 50)" fill="#E8B4CB"/>
              {/* Bottom right petal */}
              <ellipse cx="65" cy="65" rx="8" ry="15" transform="rotate(135 65 65)" fill="#F4A6CD"/>
              {/* Bottom petal */}
              <ellipse cx="50" cy="75" rx="8" ry="15" transform="rotate(180 50 75)" fill="#E8B4CB"/>
              {/* Bottom left petal */}
              <ellipse cx="35" cy="65" rx="8" ry="15" transform="rotate(225 35 65)" fill="#F4A6CD"/>
              {/* Left petal */}
              <ellipse cx="25" cy="50" rx="8" ry="15" transform="rotate(270 25 50)" fill="#E8B4CB"/>
              {/* Top left petal */}
              <ellipse cx="35" cy="35" rx="8" ry="15" transform="rotate(315 35 35)" fill="#F4A6CD"/>
            </g>
            {/* Flower center */}
            <circle cx="50" cy="50" r="10" fill="#D4A574"/>
            <circle cx="50" cy="50" r="6" fill="#C9975B"/>
            {/* Stem */}
            <rect x="48" y="75" width="4" height="20" fill="#8FBC8F"/>
            {/* Leaves */}
            <ellipse cx="42" cy="85" rx="6" ry="3" fill="#8FBC8F"/>
            <ellipse cx="58" cy="88" rx="6" ry="3" fill="#8FBC8F"/>
          </svg>
        </div>

        <Button 
          onClick={() => closeModal()} 
          className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0"
        >
          Continue Your Journey
        </Button>
      </DialogContent>
    </Dialog>
  );
}