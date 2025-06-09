import { Gem, BookOpen, ChefHat, Sparkles } from "lucide-react";

export default function ShopSection() {
  const shopCategories = [
    {
      id: 'judaica',
      icon: Sparkles,
      title: 'Judaica',
      subtitle: 'Ritual Items',
      color: 'text-blush'
    },
    {
      id: 'books',
      icon: BookOpen,
      title: 'Books',
      subtitle: 'Jewish Literature',
      color: 'text-peach'
    },
    {
      id: 'kitchen',
      icon: ChefHat,
      title: 'Kitchen',
      subtitle: 'Kosher Essentials',
      color: 'text-blush'
    },
    {
      id: 'jewelry',
      icon: Gem,
      title: 'Jewelry',
      subtitle: 'Jewish Jewelry',
      color: 'text-peach'
    }
  ];

  return (
    <div className="h-full p-4">
      <div className="grid grid-cols-2 gap-3 h-full">
        {shopCategories.map(({ id, icon: Icon, title, subtitle, color }) => (
          <div
            key={id}
            className="content-card rounded-2xl p-4 cursor-pointer"
          >
            <div className="text-center">
              <Icon className={`text-2xl ${color} mb-2 mx-auto`} size={32} />
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Bottom padding to prevent last element from being cut off by navigation */}
      <div className="h-24"></div>
    </div>
  );
}
