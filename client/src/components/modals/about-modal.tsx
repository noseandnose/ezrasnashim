import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { LazyImage } from "@/components/ui/lazy-image";
import justOneChesedImage from '@assets/Second print Photo Signs - Chamal  copy_1753336662272.png';
import projectOfImage from "@assets/A project of_1756118917799.png";

export default function AboutModal() {
  const { activeModal, closeModal } = useModalStore();

  return (
    <Dialog open={activeModal === 'about'} onOpenChange={() => closeModal(true)}>
      <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto platypi-regular">
        
        {/* Standardized Header - centered title only */}
        <div className="flex items-center justify-center mb-1 relative pr-8">
          <DialogTitle className="text-lg platypi-bold text-black">About Ezras Nashim</DialogTitle>
        </div>

        {/* Content Area - expanded white area */}
        <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[65vh] overflow-y-auto">
          <div className="text-sm text-black leading-relaxed mb-4">
            <p className="platypi-semibold mb-3">Ezras Nashim</p>
            
            <p className="mb-3">
              Ezras Nashim is a project of{" "}
              <a 
                href="https://justonechesed.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline platypi-medium"
              >
                Just One Chesed
              </a>
              .<br />
              We help Jewish women bring Torah, tefillah, and tzedaka into everyday life.
            </p>
            
            <p className="mb-3">
              A quiet companion.<br />
              A soft place to breathe and grow.<br />
              Simple pure connection.
            </p>
            
            <p className="mb-3">
              From a compass that points your heart to Yerushalayim,<br />
              to a minute of daily chizuk,<br />
              to a recipe that turns a house into Shabbos.<br />
              One small step. One bright moment.
            </p>
            
            <p className="mb-3">
              Our mission is simple - one million mitzvas every month.
            </p>
            
            <p className="mb-3">
              Through the quiet strength of women.<br />
              Through kindness, prayer, and love.
            </p>
            
            <p className="mb-3">
              Every mitzvah counts.<br />
              Every moment matters.<br />
              Begin with one, and light spreads.
            </p>
            
            <p className="mb-4 platypi-medium">
              Ezras Nashim. Simple pure connection
            </p>
          </div>
          
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
              <LazyImage 
                src={justOneChesedImage} 
                alt="JustOneChesed Logo" 
                className="max-w-full h-auto rounded-lg cursor-pointer"
                style={{ maxHeight: '120px' }}
              />
            </a>
          </div>
        </div>

        {/* Project of JustOneChesed Image */}
        <div className="flex justify-center mb-4">
          <a 
            href="https://justonechesed.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-60 transition-opacity"
          >
            <img src={projectOfImage} alt="Project of JustOneChesed" className="h-8 opacity-80 cursor-pointer" />
          </a>
        </div>

        {/* Complete Button */}
        <Button
          onClick={() => closeModal(true)}
          className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}