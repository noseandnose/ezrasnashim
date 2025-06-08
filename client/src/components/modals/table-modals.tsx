import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";

export default function TableModals() {
  const { activeModal, closeModal } = useModalStore();

  const { data: recipeContent, isLoading: recipeLoading } = useQuery({
    queryKey: ['/api/content/recipe'],
    enabled: activeModal === 'recipe'
  });

  const { data: inspirationContent, isLoading: inspirationLoading } = useQuery({
    queryKey: ['/api/content/inspiration'],
    enabled: activeModal === 'inspiration'
  });

  const { data: parshaContent, isLoading: parshaLoading } = useQuery({
    queryKey: ['/api/content/parsha'],
    enabled: activeModal === 'parsha'
  });

  return (
    <>
      {/* Recipe Modal */}
      <Dialog open={activeModal === 'recipe'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Shabbas Recipe</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            {recipeLoading ? "Loading..." : 
             recipeContent && recipeContent[0] ? recipeContent[0].content : 
             "Honey Glazed Challah recipe with step-by-step instructions..."}
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Table Inspiration Modal */}
      <Dialog open={activeModal === 'inspiration'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Table Inspiration</DialogTitle>
          </DialogHeader>
          
          <div className="text-center text-gray-600">
            {inspirationLoading ? "Loading..." : 
             inspirationContent && inspirationContent[0] ? inspirationContent[0].content : 
             "Beautiful Chanukah table setting ideas and decorations..."}
          </div>

          <Button 
            onClick={() => closeModal()} 
            className="w-full gradient-blush-peach text-white py-3 rounded-xl font-medium mt-6 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Parsha Vort Audio Modal */}
      <Dialog open={activeModal === 'parsha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold mb-2">Parsha Vort</DialogTitle>
            <p className="text-sm text-gray-600 mb-4">
              {parshaContent && parshaContent[0] ? parshaContent[0].title : "Parshas Vayeshev"}
            </p>
          </DialogHeader>
          
          {!parshaLoading && parshaContent && parshaContent[0] && (
            <AudioPlayer 
              title={parshaContent[0].title}
              duration="3:15"
              audioUrl={parshaContent[0].audioUrl || ""}
            />
          )}

          <Button 
            onClick={() => closeModal()} 
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-medium mt-4"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
