import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { HandHeart, Scroll, Heart } from "lucide-react";

export default function TefillaModals() {
  const { activeModal, openModal, closeModal } = useModalStore();

  return (
    <>
      {/* Tehillim Modal */}
      <Dialog open={activeModal === 'tehillim'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Tehillim Cycle</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            Today's Tehillim chapters (140-150) with translations and commentary...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Mincha Modal */}
      <Dialog open={activeModal === 'mincha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Mincha</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            Afternoon prayer service with proper timing and instructions...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Women's Prayers Modal */}
      <Dialog open={activeModal === 'womens-prayers'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Women's Prayers</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <div 
              className="content-card rounded-xl p-4 cursor-pointer"
              onClick={() => {
                closeModal();
                openModal('blessings');
              }}
            >
              <div className="flex items-center space-x-3">
                <HandHeart className="text-blush" size={20} />
                <span className="font-medium">Blessings</span>
              </div>
            </div>
            
            <div 
              className="content-card rounded-xl p-4 cursor-pointer"
              onClick={() => {
                closeModal();
                openModal('tefillos');
              }}
            >
              <div className="flex items-center space-x-3">
                <Scroll className="text-peach" size={20} />
                <span className="font-medium">Tefillos</span>
              </div>
            </div>
            
            <div 
              className="content-card rounded-xl p-4 cursor-pointer"
              onClick={() => {
                closeModal();
                openModal('personal-prayers');
              }}
            >
              <div className="flex items-center space-x-3">
                <Heart className="text-blush" size={20} />
                <span className="font-medium">Personal Prayers</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Blessings Modal */}
      <Dialog open={activeModal === 'blessings'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Blessings</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            Daily blessings and their proper recitation...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Tefillos Modal */}
      <Dialog open={activeModal === 'tefillos'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Tefillos</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            Traditional prayers and their meanings...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Personal Prayers Modal */}
      <Dialog open={activeModal === 'personal-prayers'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Personal Prayers</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            Guidance for personal prayer and connection...
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
