import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/types";
import { Heart } from "lucide-react";

interface Sponsor {
  name: string;
  inHonorMemoryOf?: string;
  message?: string;
  sponsorshipDate: string;
}

export default function SponsorDetailsModal() {
  const { activeModal, closeModal } = useModalStore();
  const isOpen = activeModal === 'sponsor-details';

  // Fetch today's sponsor
  const today = new Date().toISOString().split('T')[0];
  const { data: sponsor } = useQuery<Sponsor>({
    queryKey: ['daily-sponsor', today, 'v2'], // Added version to match home section
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sponsors/daily/${today}?t=${Date.now()}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 0, // No caching
    gcTime: 1000, // Short cache time
    refetchOnMount: true
  });

  if (!sponsor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-md mx-auto rounded-3xl p-0 overflow-hidden bg-white border-2 border-blush/20 max-h-[95vh] overflow-y-auto">
        <DialogHeader className="p-4 pb-2 text-center">
          <DialogTitle className="text-lg font-serif font-bold text-black">
            Today's Sponsor
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 pb-4">
          {/* White content area */}
          <div className="bg-white rounded-2xl p-6 border border-blush/10 mb-1 max-h-[60vh] overflow-y-auto">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-feminine p-3 rounded-full">
                  <Heart className="text-white" size={24} />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-black">
                  {sponsor.name}
                </h3>
                
                {sponsor.inHonorMemoryOf && (
                  <div className="bg-blush/10 rounded-xl p-3">
                    <p className="font-sans text-sm text-black leading-relaxed">
                      {sponsor.inHonorMemoryOf}
                    </p>
                  </div>
                )}
                
                {sponsor.message && (
                  <div className="bg-lavender/10 rounded-xl p-3">
                    <p className="font-sans text-sm text-black leading-relaxed">
                      {sponsor.message}
                    </p>
                  </div>
                )}
                
                <div className="text-center pt-2">
                  <p className="font-serif text-xs text-black/60">
                    Sponsored on {new Date(sponsor.sponsorshipDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Close button */}
          <Button
            onClick={closeModal}
            className="w-full bg-gradient-feminine hover:opacity-90 text-white rounded-2xl py-3 font-sans font-medium transition-all duration-300 hover:scale-105"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}