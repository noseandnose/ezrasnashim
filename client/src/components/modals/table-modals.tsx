import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { useModalStore } from "./../lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AudioPlayer from "../audio-player";

export default function TableModals() {
  const { activeModal, closeModal } = useModalStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const getWeekKey = () => {
    const date = new Date();
    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
    return `${year}-W${week}`;
  };

  const { data: recipeContent } = useQuery<any>({
    queryKey: ['/api/table/recipe', getWeekKey()],
    enabled: activeModal === 'recipe'
  });

  const { data: inspirationContent } = useQuery<any>({
    queryKey: [`/api/table/inspiration/${new Date().toISOString().split('T')[0]}`],
    enabled: activeModal === 'inspiration'
  });

  const { data: parshaContent } = useQuery<any>({
    queryKey: ['/api/table/vort', getWeekKey()],
    enabled: activeModal === 'parsha'
  });

  return (
    <>
      {/* Recipe Modal */}
      <Dialog open={activeModal === 'recipe'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Shabbat Recipe</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">Traditional Challah</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Ingredients:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>4 cups bread flour</li>
                <li>1 packet active dry yeast</li>
                <li>1/4 cup warm water</li>
                <li>1/4 cup honey</li>
                <li>2 eggs + 1 for brushing</li>
                <li>1/4 cup oil</li>
                <li>1 tsp salt</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <p>Mix warm water with yeast and let bloom. Combine all ingredients, knead until smooth. Let rise for 1 hour, then braid and let rise again before baking at 350°F for 25-30 minutes.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Inspiration Modal */}
      <Dialog open={activeModal === 'inspiration'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby="inspiration-description">
          <DialogHeader className="text-center mb-2">
            <DialogTitle className="text-lg font-semibold">Shabbas Inspiration</DialogTitle>
            <DialogDescription className="sr-only">Shabbas table inspiration modal</DialogDescription>
          </DialogHeader>
          <div id="inspiration-description" className="sr-only">Daily table inspiration and decorating ideas for Shabbat</div>
          
          {inspirationContent ? (
            <>
              {/* Image Gallery - Single Image with Navigation */}
              {(() => {
                const images = [
                  inspirationContent.imageUrl1,
                  inspirationContent.imageUrl2,
                  inspirationContent.imageUrl3,
                  inspirationContent.imageUrl4,
                  inspirationContent.imageUrl5
                ].filter(Boolean);
                
                if (images.length === 0) return null;
                
                const nextImage = () => {
                  setCurrentImageIndex((prev) => (prev + 1) % images.length);
                };
                
                const prevImage = () => {
                  setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                };
                
                return (
                  <div className="mb-4 relative">
                    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative">
                      <img 
                        src={images[currentImageIndex]} 
                        alt={`Table inspiration ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={nextImage}
                      />
                      
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                          >
                            <ChevronRight size={20} />
                          </button>
                          
                          {/* Image counter dots */}
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            {images.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${
                                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Title from Database */}
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{inspirationContent.title}</h3>
              </div>
              
              {/* Content Text */}
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p>{inspirationContent.content}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-full h-48 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl flex items-center justify-center border border-gray-200 mb-4">
                <div className="text-center text-gray-600">
                  <svg className="mx-auto mb-2 w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">No inspiration content available</p>
                  <p className="text-xs">Please add content to the database</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Parsha Vort Modal */}
      <Dialog open={activeModal === 'parsha'} onOpenChange={() => closeModal()}>
        <DialogContent>
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold mb-2">Parsha Vort</DialogTitle>
            <p className="text-sm text-gray-600 mb-4">
              {parshaContent?.title || "This Week's Torah Portion"}
            </p>
          </DialogHeader>
          
          <AudioPlayer 
            title={parshaContent?.title || "Parsha Vort"}
            duration="3:15"
            audioUrl={parshaContent?.audioUrl || ""}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}