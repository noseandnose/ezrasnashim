import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModalStore } from "@/lib/types";

export default function TableModals() {
  const { activeModal, closeModal } = useModalStore();

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
        <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold mb-2">Parsha Vort</DialogTitle>
            <p className="text-sm text-gray-600">Parshat Vayeshev</p>
          </DialogHeader>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p><strong>This Week's Insight:</strong> The dreams of Yosef teach us about the power of vision and perseverance.</p>
              <p className="mt-2">Even when circumstances seem challenging, maintaining faith in our purpose and potential can lead to extraordinary outcomes.</p>
              <p className="mt-2"><strong>Table Discussion:</strong> How can we support each other's dreams and aspirations within our families?</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}