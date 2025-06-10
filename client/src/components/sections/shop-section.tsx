import { useQuery } from "@tanstack/react-query";
import { useModalStore } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import type { ShopItem } from "@shared/schema";

export default function ShopSection() {
  const { openModal } = useModalStore();

  const { data: shopItems = [], isLoading } = useQuery<ShopItem[]>({
    queryKey: ['/api/shop'],
  });

  const handleItemClick = (item: ShopItem) => {
    openModal(`shop-${item.id}`);
  };

  if (isLoading) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blush/20 border-t-blush rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <div className="space-y-3">
        {shopItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="bg-gradient-to-r from-blush to-peach rounded-2xl p-[2px] cursor-pointer hover:from-blush/80 hover:to-peach/80 transition-all duration-300"
          >
            <div className="content-card rounded-2xl overflow-hidden">
              {/* Background image with overlay */}
              <div 
                className="relative h-20 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${item.backgroundImageUrl})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
                }}
              >
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-black bg-opacity-40" />
                
                {/* Content overlay */}
                <div className="relative h-full flex items-center justify-between p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-white/90 text-xs mt-1">
                      {item.storeName}
                    </p>
                  </div>
                  <ChevronRight className="text-white" size={20} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Bottom padding to prevent last element from being cut off by navigation */}
      <div className="h-24"></div>
    </div>
  );
}