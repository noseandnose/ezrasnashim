import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { HandHeart, Scroll, Heart, Languages, Type, Plus, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MinchaPrayer } from "@shared/schema";

export default function TefillaModals() {
  const { activeModal, openModal, closeModal } = useModalStore();
  const [language, setLanguage] = useState<'hebrew' | 'english'>('english');
  const [fontSize, setFontSize] = useState(16);

  const { data: minchaPrayers = [], isLoading } = useQuery<MinchaPrayer[]>({
    queryKey: ['/api/mincha/prayers'],
    enabled: activeModal === 'mincha'
  });

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
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Mincha Prayer</DialogTitle>
          </DialogHeader>
          
          {/* Language and Font Controls */}
          <div className="flex items-center justify-between mb-6 p-3 bg-cream-light rounded-xl">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-blush-pink" />
              <button
                onClick={() => setLanguage(language === 'hebrew' ? 'english' : 'hebrew')}
                className="text-sm font-medium text-blush-pink hover:text-peach-warm transition-colors"
              >
                {language === 'hebrew' ? 'עברית' : 'English'}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-blush-pink" />
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className="p-1 hover:bg-white rounded-md transition-colors"
              >
                <Minus className="h-3 w-3 text-blush-pink" />
              </button>
              <span className="text-xs text-gray-600 min-w-[2rem] text-center">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                className="p-1 hover:bg-white rounded-md transition-colors"
              >
                <Plus className="h-3 w-3 text-blush-pink" />
              </button>
            </div>
          </div>

          {/* Prayer Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center text-gray-500">Loading prayers...</div>
            ) : (
              minchaPrayers.map((prayer) => (
                <div key={prayer.id} className="p-4 bg-white rounded-xl border border-cream-light">
                  <div className="text-center">
                    <div
                      className={`${language === 'hebrew' ? 'font-hebrew text-right' : 'font-english'} leading-relaxed`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {language === 'hebrew' ? prayer.hebrewText : prayer.englishTranslation}
                    </div>
                    {prayer.transliteration && language === 'english' && (
                      <div
                        className="text-gray-500 italic mt-2"
                        style={{ fontSize: `${fontSize - 2}px` }}
                      >
                        {prayer.transliteration}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
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
