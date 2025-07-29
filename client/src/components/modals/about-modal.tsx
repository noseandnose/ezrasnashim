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
            , created to uplift Jewish women through Torah, tefillah, and tzedaka—woven into everyday life.
          </p>
          
          <p className="text-sm text-black leading-relaxed mb-4">
            This app is here to be your quiet companion. A soft space to grow, reconnect, and add light to your home and heart—one small moment at a time.
          </p>
          
          <p className="text-sm text-black leading-relaxed mb-4">
            Our vision is clear and beautiful:<br />
            To reach one million mitzvos every month.
          </p>
          
          <p className="text-sm text-black leading-relaxed mb-4">
            Not through pressure or perfection.<br />
            But through the quiet power of women doing what they do best—<br />
            bringing Hashem into the world through kindness, prayer, and love.
          </p>
          
          <p className="text-sm text-black leading-relaxed mb-4">
            Every mitzvah counts.<br />
            Every moment matters.<br />
            And together, we can create something truly extraordinary.
          </p>
          
          <p className="text-sm text-black leading-relaxed mb-4">
            Zmanim and Date Converter are powered by{" "}
            <a 
              href="https://www.hebcal.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline platypi-medium"
            >
              Hebcal
            </a>
            .
          </p>
          
          {/* JustOneChesed Logo - Now Clickable */}
          <div className="flex justify-center mt-4">
            <a 
              href="https://justonechesed.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src={justOneChesedImage} 
                alt="JustOneChesed Logo" 
                className="max-w-full h-auto rounded-lg cursor-pointer"
                style={{ maxHeight: '120px' }}
              />
            </a>
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