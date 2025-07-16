import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModalStore } from "@/lib/types";
import { X } from "lucide-react";

export default function AboutModal() {
  const { activeModal, closeModal } = useModalStore();
  const isOpen = activeModal === 'about';

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-2xl border-0 max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4">
          <DialogTitle className="text-lg font-serif font-bold text-black">About Ezras Nashim</DialogTitle>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-black/70" />
          </button>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10 max-h-[50vh] overflow-y-auto">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}