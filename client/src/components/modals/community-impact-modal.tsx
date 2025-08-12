import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useModalStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export function CommunityImpactModal() {
  const { activeModal, closeModal } = useModalStore();
  const isOpen = activeModal === 'community-impact';
  
  const today = new Date().toISOString().split('T')[0];
  
  const { data: impactContent, isLoading } = useQuery<{
    id: number;
    title: string;
    description: string;
    imageUrl: string;
  }>({
    queryKey: [`/api/community/impact/${today}`],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/community/impact/${today}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: isOpen,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 60 minutes
  });

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="w-[95vw] max-w-md rounded-3xl p-0 gap-0 max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between p-4 pb-1">
          <DialogTitle className="text-lg platypi-bold text-black text-center flex-1 pr-8">
            Community Impact
          </DialogTitle>
          <button
            onClick={closeModal}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-black" />
          </button>
        </DialogHeader>

        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="w-full h-48 bg-gray-200 rounded-2xl"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ) : impactContent ? (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="w-full h-48 rounded-2xl overflow-hidden">
                <img 
                  src={impactContent.imageUrl} 
                  alt={impactContent.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="bg-white rounded-2xl p-4 border border-blush/10">
                <h2 className="platypi-bold text-lg text-black mb-3">{impactContent.title}</h2>
                <div className="platypi-regular text-sm text-black leading-relaxed whitespace-pre-line">
                  {impactContent.description}
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={closeModal}
                className="w-full bg-gradient-feminine hover:opacity-90 text-white platypi-medium rounded-2xl py-3"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="platypi-regular text-black/60">No community impact story available today.</p>
              <Button
                onClick={closeModal}
                className="w-full mt-4 bg-gradient-feminine hover:opacity-90 text-white platypi-medium rounded-2xl py-3"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}