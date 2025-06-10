import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModalStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import AudioPlayer from "@/components/audio-player";

export default function TableModals() {
  const { activeModal, closeModal } = useModalStore();
  
  const getWeekKey = () => {
    const date = new Date();
    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
    return `${year}-W${week}`;
  };

  const { data: recipeContent } = useQuery({
    queryKey: ['/api/table/recipe', getWeekKey()],
    enabled: activeModal === 'recipe'
  });

  const { data: inspirationContent } = useQuery({
    queryKey: ['/api/table/inspiration', new Date().toISOString().split('T')[0]],
    enabled: activeModal === 'inspiration'
  });

  const { data: parshaContent } = useQuery({
    queryKey: ['/api/table/vort', getWeekKey()],
    enabled: activeModal === 'parsha'
  });

  return (
    <>
      {/* Recipe Modal */}
      <Dialog open={activeModal === 'recipe'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Shabbat Recipe</DialogTitle>
            <p className="text-sm text-gray-600">Traditional Challah</p>
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
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Table Inspiration</DialogTitle>
            <p className="text-sm text-gray-600">Beautiful Shabbat Settings</p>
          </DialogHeader>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p><strong>This Week's Theme:</strong> Winter Elegance</p>
              <p className="mt-2">Create a warm atmosphere with soft candlelight, white linens, and silver accents. Add pinecones or evergreen sprigs for a seasonal touch.</p>
              <p className="mt-2"><strong>Color Palette:</strong> Cream, silver, and deep green</p>
              <p className="mt-2"><strong>Special Touch:</strong> Place a small scroll with the week's parsha summary at each setting for meaningful table discussion.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Parsha Vort Modal */}
      <Dialog open={activeModal === 'parsha'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
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