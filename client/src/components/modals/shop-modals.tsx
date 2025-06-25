import { useQuery } from "@tanstack/react-query";
import { useModalStore } from "../../lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import type { ShopItem } from "@shared/schema";

export default function ShopModals() {
  const { activeModal, closeModal } = useModalStore();
  const { toast } = useToast();

  // Extract shop item ID from modal name (e.g., "shop-1" -> "1")
  const shopItemId = activeModal?.startsWith('shop-') 
    ? parseInt(activeModal.replace('shop-', '')) 
    : null;

  const { data: shopItem, isLoading } = useQuery<ShopItem>({
    queryKey: [`/api/shop/${shopItemId}`],
    enabled: !!shopItemId,
  });

  const handleCopyCoupon = () => {
    if (shopItem?.couponCode) {
      navigator.clipboard.writeText(shopItem.couponCode);
      toast({
        title: "Coupon Copied!",
        description: `Code "${shopItem.couponCode}" copied to clipboard`,
      });
    }
  };

  const handleVisitStore = () => {
    if (shopItem?.externalUrl) {
      window.open(shopItem.externalUrl, '_blank');
    }
  };

  const isOpen = activeModal?.startsWith('shop-') || false;

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-center mb-4">
          <DialogTitle className="text-lg font-serif font-semibold mb-2">
            {shopItem ? shopItem.storeName : 'Store Details'}
          </DialogTitle>
          {shopItem && (
            <DialogDescription className="text-sm text-gray-600 font-sans">{shopItem.title}</DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blush/20 border-t-blush rounded-full"></div>
          </div>
        ) : shopItem ? (
          <div className="space-y-4">
            {/* Header with background image */}
            <div 
              className="relative h-32 bg-cover bg-center rounded-xl overflow-hidden"
              style={{ 
                backgroundImage: `url(${shopItem.backgroundImageUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50" />
              
              {/* Title overlay */}
              <div className="relative h-full flex items-center justify-center p-6">
                <h2 className="font-semibold text-white text-lg text-center leading-tight">
                  {shopItem.title}
                </h2>
              </div>
            </div>

            {/* Description */}
            <div className="text-center">
              <p className="text-gray-600 text-sm leading-relaxed">
                {shopItem.description}
              </p>
            </div>

            {/* Coupon section */}
            {shopItem.couponCode && (
              <div className="bg-cream/50 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-center text-gray-900">Coupon Code</h4>
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border-2 border-dashed border-blush/30">
                  <code className="font-mono font-semibold text-blush text-lg">
                    {shopItem.couponCode}
                  </code>
                  <Button
                    onClick={handleCopyCoupon}
                    variant="ghost"
                    size="sm"
                    className="text-blush hover:bg-blush/10"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
                {shopItem.externalUrl && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Redeem at:</p>
                    <p className="text-sm text-blush font-medium break-all">
                      {shopItem.externalUrl.replace(/^https?:\/\//, '')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              {shopItem.externalUrl && (
                <Button
                  onClick={handleVisitStore}
                  className="flex-1 bg-blush hover:bg-blush/90 text-white"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Visit Store
                </Button>
              )}
              <Button
                onClick={closeModal}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600">Store not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}