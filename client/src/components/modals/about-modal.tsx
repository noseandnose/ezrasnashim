import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import justOneChesedImage from '@assets/Second print Photo Signs - Chamal  copy_1753336662272.png';

export default function AboutModal() {
  const { activeModal, closeModal } = useModalStore();

  return (
    <Dialog open={activeModal === 'about'} onOpenChange={() => closeModal()}>
      <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
        
        {/* Standardized Header - centered title only */}
        <div className="flex items-center justify-center mb-1 relative pr-8">
          <DialogTitle className="text-lg platypi-bold text-black">About Ezras Nashim</DialogTitle>
        </div>

        {/* Content Area - expanded white area */}
        <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[65vh] overflow-y-auto">
          <p className="text-sm text-black leading-relaxed mb-4">
            Ezras Nashim is a project of{" "}
            <a 
              href="https://justonechesed.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline platypi-medium"
            >
              Just One Chesed
            </a>
            , created to empower Jewish women through Torah, tefillah, and tzedaka in everyday life.
          </p>
          
          <p className="text-sm text-black leading-relaxed mb-4">
            This app is a simple, beautiful companion to help you grow, connect, and elevate your home and heart—one moment at a time.
          </p>
          
          <p className="text-sm text-black leading-relaxed mb-4">
            Our first three bold goals are: to become the largest seminary in the world, to inspire a million mitzvos a month, and to help bring Mashiach—together.
          </p>
          
          <p className="text-sm text-black leading-relaxed mb-4">
            Zmanim and Date Converter are provided by{" "}
            <a 
              href="https://www.hebcal.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline platypi-medium"
            >
              Hebcal
            </a>
          </p>
          
          {/* JustOneChesed Logo */}
          <div className="flex justify-center mt-4">
            <img 
              src={justOneChesedImage} 
              alt="JustOneChesed Logo" 
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '120px' }}
            />
          </div>
        </div>

        {/* Complete Button */}
        <Button
          onClick={closeModal}
          className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}