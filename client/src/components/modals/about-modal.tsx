import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import projectOfImage from "@assets/A project of_1756118917799.png";
import { handleLogoTapForDebug } from "@/lib/debug-instrumentation";

export default function AboutModal() {
  const { activeModal, closeModal } = useModalStore();
  
  const handleChesedLogoTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogoTapForDebug();
  };

  return (
    <Dialog open={activeModal === 'about'} onOpenChange={() => closeModal(true)}>
      <DialogContent className="!fixed !left-[50%] !top-[50%] !-translate-x-1/2 !-translate-y-1/2 max-w-md max-h-[90vh] overflow-y-auto">
        
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
        </div>

        {/* Project of JustOneChesed Image - tap 7 times to enable debug mode */}
        <div className="flex justify-center mb-4">
          <img 
            src={projectOfImage} 
            alt="Project of JustOneChesed" 
            className="h-8 opacity-80 cursor-pointer hover:opacity-60 transition-opacity" 
            onClick={handleChesedLogoTap}
          />
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