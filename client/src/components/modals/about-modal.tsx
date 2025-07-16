import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";

export default function AboutModal() {
  const { activeModal, closeModal } = useModalStore();

  return (
    <Dialog open={activeModal === 'about'} onOpenChange={() => closeModal()}>
      <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[95vh] overflow-y-auto font-sans">
        
        {/* Standardized Header - centered title only */}
        <div className="flex items-center justify-center mb-3 relative pr-8">
          <DialogTitle className="text-lg font-serif font-bold text-black">About Ezras Nashim</DialogTitle>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl p-6 mb-1 shadow-sm border border-warm-gray/10 max-h-[50vh] overflow-y-auto">
          <p className="text-sm text-black leading-relaxed mb-4">
            Ezras Nashim is a project of{" "}
            <a 
              href="https://justonechesed.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Just One Chesed
            </a>
            , created to empower Jewish women through Torah, tefillah, and tzedaka in everyday life.
          </p>
          
          <p className="text-sm text-black leading-relaxed mb-4">
            This app is a simple, beautiful companion to help you grow, connect, and elevate your home and heart—one moment at a time.
          </p>
          
          <p className="text-sm text-black leading-relaxed">
            Our first three bold goals are: to become the largest seminary in the world, to inspire a million mitzvos a month, and to help bring Mashiach—together.
          </p>
        </div>

        {/* Complete Button */}
        <Button
          onClick={closeModal}
          className="w-full bg-gradient-blush hover:opacity-90 text-white font-medium py-3 rounded-2xl transition-all shadow-soft"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}