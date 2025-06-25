import { useQuery } from "@tanstack/react-query";
import { useModalStore } from "../../../lib/types";
import { ShoppingBag, Star, Gift, Sparkles, Heart, Package, Tag, Store } from "lucide-react";
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
      <div className="h-full p-3 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blush/20 border-t-blush rounded-full" />
      </div>
    );
  }

  // Featured categories with consistent styling
  const shopCategories = [
    {
      id: 'judaica',
      icon: Star,
      title: 'Judaica',
      subtitle: 'Beautiful ceremonial items',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10'
    },
    {
      id: 'books',
      icon: Package,
      title: 'Books & Learning',
      subtitle: 'Torah & Jewish texts',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10'
    },
    {
      id: 'gifts',
      icon: Gift,
      title: 'Gifts',
      subtitle: 'Special occasion items',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10'
    },
    {
      id: 'home',
      icon: Heart,
      title: 'Home & Kitchen',
      subtitle: 'Kosher essentials',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10'
    }
  ];

  return (
    <div className="p-2 space-y-1">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-serif text-lg text-warm-gray mb-1 tracking-wide">Jewish Shop</h2>
        <p className="font-sans text-warm-gray/70 text-xs leading-relaxed">Beautiful items for your Jewish home</p>
      </div>

      {/* Featured Store Banner */}
      <div className="bg-gradient-soft rounded-3xl p-3 mb-4 shadow-lg">
        <div className="bg-gradient-feminine p-2 rounded-full mx-auto mb-2 w-fit">
          <Store className="text-white" size={18} strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-xs text-warm-gray mb-2 text-center tracking-wide">Featured Partner</h3>
        <p className="font-sans text-xs text-warm-gray/80 text-center leading-relaxed">
          Explore curated collections from trusted Jewish retailers
        </p>
      </div>

      {/* Shop Categories Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {shopCategories.map(({ id, icon: Icon, title, subtitle, gradient, iconBg, iconColor, border }) => (
          <button
            key={id}
            className={`${gradient} rounded-3xl p-3 text-center glow-hover transition-gentle shadow-lg border ${border}`}
            onClick={() => openModal(id)}
          >
            <div className={`${iconBg} p-2 rounded-full mx-auto mb-2 w-fit`}>
              <Icon className={`${iconColor}`} size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-warm-gray mb-1 tracking-wide">{title}</h3>
            <p className="font-sans text-xs text-warm-gray/60 leading-relaxed">{subtitle}</p>
          </button>
        ))}
      </div>

      {/* Individual Shop Items */}
      {shopItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-serif text-sm text-warm-gray mb-2 text-center tracking-wide">Featured Items</h3>
          {shopItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="w-full bg-white rounded-3xl p-3 shadow-lg border border-blush/10 glow-hover transition-gentle text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-feminine p-2 rounded-full">
                  <Tag className="text-white" size={18} strokeWidth={1.5} />
                </div>
                <div className="flex-grow">
                  <h4 className="font-serif text-xs text-warm-gray mb-1 tracking-wide">{item.title}</h4>
                  <p className="font-sans text-xs text-warm-gray/60 leading-relaxed">{item.storeName}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-warm-gray/40 font-sans">Shop</div>
                  <Sparkles className="text-warm-gray/40 ml-auto" size={16} strokeWidth={1.5} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-16"></div>
    </div>
  );
}